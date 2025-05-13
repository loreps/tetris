"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import TetrisGame from "@/components/tetris-game"
import Leaderboard from "@/components/leaderboard"
import GameTimer from "@/components/game-timer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getRoom, createOrGetPlayer, createOrUpdateLeaderboardEntry, isSupabaseConfigured } from "@/utils/supabase"
import { AlertTriangle, Share2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

export default function RoomPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [roomConfig, setRoomConfig] = useState<any>(null)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [gameKey, setGameKey] = useState(Date.now()) // Used to force remount the game
  const [username, setUsername] = useState<string>("")
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [dbError, setDbError] = useState<string | null>(null)

  const mountedRef = useRef(false)
  const roomLoadedRef = useRef(false)
  const scoreUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load username and initialize player
  useEffect(() => {
    const savedUsername = localStorage.getItem("tetris_username") || `Player_${Math.floor(Math.random() * 10000)}`
    setUsername(savedUsername)

    // Initialize player in the database
    const initPlayer = async () => {
      // Generate a unique player ID
      const generatedPlayerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      setPlayerId(generatedPlayerId)

      if (!isSupabaseConfigured) {
        return
      }

      try {
        // Create or get player - pass the room ID
        const player = await createOrGetPlayer(generatedPlayerId, savedUsername, params.id)
        if (player) {
          // Create initial leaderboard entry with score 0
          await createOrUpdateLeaderboardEntry(params.id, player.id, 0)
        } else {
          // If player creation failed, it might be due to missing tables
          setDbError("Database tables may not be set up. Please visit /admin/database-setup to create them.")
        }
      } catch (error) {
        console.error("Error initializing player:", error)
        setDbError("Error initializing player. Database tables may not be set up correctly.")
      }
    }

    initPlayer()
  }, [params.id])

  // Set up periodic score updates
  useEffect(() => {
    if (!playerId || !isSupabaseConfigured || dbError) return

    // Update score in database every 2 seconds
    scoreUpdateIntervalRef.current = setInterval(() => {
      if (playerId) {
        createOrUpdateLeaderboardEntry(params.id, playerId, score)
      }
    }, 2000)

    return () => {
      if (scoreUpdateIntervalRef.current) {
        clearInterval(scoreUpdateIntervalRef.current)
      }
    }
  }, [playerId, score, params.id, dbError])

  // Load room data
  useEffect(() => {
    // Prevent multiple initializations
    if (mountedRef.current) return
    mountedRef.current = true

    const loadRoom = async () => {
      setIsLoading(true)

      try {
        let roomData = null

        if (isSupabaseConfigured) {
          // Try to fetch from Supabase first
          roomData = await getRoom(params.id)
        }

        // If not found in Supabase or Supabase is not available, try localStorage
        if (!roomData) {
          const localRoomData = localStorage.getItem(`room_${params.id}`)
          if (!localRoomData) {
            router.push("/")
            return
          }
          roomData = JSON.parse(localRoomData)
        }

        setRoomConfig({
          id: roomData.id,
          name: roomData.name,
          gameTime: roomData.game_time || roomData.gameTime,
          difficulty: roomData.difficulty,
          specialBlockFrequency: roomData.special_block_frequency || roomData.specialBlockFrequency,
        })

        // Ensure gameTime is valid
        const gameTime = Math.max(60, roomData.game_time || roomData.gameTime || 300) // Minimum 1 minute, default 5 minutes

        // Set time remaining after a short delay
        setTimeout(() => {
          setTimeRemaining(gameTime)
          setIsLoading(false)
          roomLoadedRef.current = true
        }, 500)
      } catch (error) {
        console.error("Error loading room:", error)
        router.push("/")
      }
    }

    loadRoom()

    return () => {
      mountedRef.current = false
      roomLoadedRef.current = false
      if (scoreUpdateIntervalRef.current) {
        clearInterval(scoreUpdateIntervalRef.current)
      }
    }
  }, [params.id, router])

  const handleGameOver = useCallback(
    async (finalScore: number) => {
      if (!roomLoadedRef.current) return

      setScore(finalScore)
      setGameOver(true)

      // Final update to the database
      if (isSupabaseConfigured && playerId && !dbError) {
        try {
          await createOrUpdateLeaderboardEntry(params.id, playerId, finalScore)
        } catch (error) {
          console.error("Error updating final score:", error)
        }
      }

      // Clear the interval
      if (scoreUpdateIntervalRef.current) {
        clearInterval(scoreUpdateIntervalRef.current)
        scoreUpdateIntervalRef.current = null
      }
    },
    [playerId, params.id, dbError],
  )

  const handleTimeUp = useCallback(() => {
    if (!roomLoadedRef.current) return

    setGameOver(true)
  }, [])

  // Handle play again
  const handlePlayAgain = useCallback(async () => {
    // Reset game state
    setGameOver(false)
    setScore(0)

    // Reset player score in database
    if (isSupabaseConfigured && playerId && !dbError) {
      try {
        await createOrUpdateLeaderboardEntry(params.id, playerId, 0)
      } catch (error) {
        console.error("Error resetting player score:", error)
      }
    }

    // Force remount the game component with a new key
    setGameKey(Date.now())

    // Reset time remaining
    if (roomConfig) {
      const gameTime = Math.max(60, roomConfig.gameTime || 300)
      setTimeRemaining(gameTime)
    }

    // Restart score update interval
    if (scoreUpdateIntervalRef.current) {
      clearInterval(scoreUpdateIntervalRef.current)
    }

    if (isSupabaseConfigured && playerId && !dbError) {
      scoreUpdateIntervalRef.current = setInterval(() => {
        createOrUpdateLeaderboardEntry(params.id, playerId, score)
      }, 2000)
    }
  }, [roomConfig, playerId, score, params.id, dbError])

  // Update time remaining handler - use a ref to prevent infinite updates
  const timeRemainingRef = useRef(timeRemaining)
  const handleTimeRemainingUpdate = useCallback((time: number) => {
    if (timeRemainingRef.current === time) return
    timeRemainingRef.current = time
    setTimeRemaining(time)
  }, [])

  // Share room functionality
  const handleShareRoom = useCallback(() => {
    const roomUrl = `${window.location.origin}/room/${params.id}`

    // Check if the Web Share API is available
    if (navigator.share) {
      navigator
        .share({
          title: `Join my Linera Tetris room: ${roomConfig?.name || "Linera Tetris"}`,
          text: `Join me for a game of Linera Tetris in room ${roomConfig?.name || params.id}!`,
          url: roomUrl,
        })
        .catch((error) => {
          console.error("Error sharing:", error)
          // Fallback to clipboard if sharing fails
          copyToClipboard(roomUrl)
        })
    } else {
      // Fallback for browsers that don't support the Web Share API
      copyToClipboard(roomUrl)
    }
  }, [params.id, roomConfig])

  // Helper function to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: "Посилання скопійовано!",
          description: "Тепер ви можете поділитися ним з друзями.",
          duration: 3000,
        })
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        toast({
          title: "Не вдалося скопіювати посилання",
          description: "Спробуйте ще раз або скопіюйте URL вручну.",
          variant: "destructive",
          duration: 3000,
        })
      })
  }

  if (isLoading || !roomConfig || timeRemaining === null) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tetris-turquoise mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    )
  }

  // Get special block frequency from room config or use default
  const specialBlockFrequency =
    typeof roomConfig.specialBlockFrequency === "number"
      ? Math.max(0, Math.min(100, roomConfig.specialBlockFrequency))
      : 15

  return (
    <div className="container py-6">
      <div className="flex flex-col items-center mb-6">
        <div className="w-full flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-tetris-turquoise to-tetris-red bg-clip-text text-transparent">
            {roomConfig.name}
          </h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleShareRoom}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-tetris-turquoise text-tetris-turquoise hover:bg-tetris-turquoise/10"
                >
                  <Share2 size={16} />
                  Поділитися кімнатою
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Поділіться посиланням на кімнату з друзями</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          <div className="text-sm text-muted-foreground">
            Difficulty: <span className="text-tetris-turquoise">{roomConfig.difficulty}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="text-tetris-red">
              Special Blocks: {specialBlockFrequency > 0 ? `${specialBlockFrequency}% chance` : "Disabled"}
            </span>
          </div>
        </div>
      </div>

      {dbError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={20} />
          <div className="text-amber-800 text-sm">{dbError}</div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto border-amber-500 text-amber-500 hover:bg-amber-50 hover:text-amber-600"
            onClick={() => router.push("/admin/database-setup")}
          >
            Setup Database
          </Button>
        </div>
      )}

      {!gameOver ? (
        <div className="flex flex-col lg:flex-row gap-6 justify-center items-center lg:items-start">
          <Card className="w-full max-w-xl border-tetris-turquoise/50">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-tetris-turquoise">Game</CardTitle>
                <GameTimer
                  key={`timer-${gameKey}`}
                  initialTime={timeRemaining}
                  onTimeUp={handleTimeUp}
                  setTimeRemaining={handleTimeRemainingUpdate}
                />
              </div>
              <CardDescription>
                Score: <span className="text-tetris-red font-bold">{score}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <TetrisGame
                key={`game-${gameKey}`}
                difficulty={roomConfig.difficulty}
                specialBlockFrequency={specialBlockFrequency}
                onGameOver={handleGameOver}
                setScore={setScore}
                timeRemaining={timeRemaining}
              />
            </CardContent>
          </Card>

          <div className="w-full max-w-xs space-y-6">
            <Card className="border-tetris-red/50">
              <CardHeader>
                <CardTitle className="text-tetris-red">Special Blocks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-tetris-red to-tetris-turquoise"></div>
                    <span>Color Bomb: Destroys all blocks of the same color</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-yellow-300 flex items-center justify-center">
                      <div className="w-4 h-1 bg-yellow-500"></div>
                    </div>
                    <span>Row Clearer: Clears the entire row</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-300 flex items-center justify-center">
                      <div className="w-1 h-4 bg-blue-500"></div>
                    </div>
                    <span>Column Clearer: Clears the entire column</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-purple-300 flex items-center justify-center">
                      <div className="w-4 h-1 bg-purple-500"></div>
                      <div className="w-1 h-4 bg-purple-500 absolute"></div>
                    </div>
                    <span>Cross Clearer: Clears row and column</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-300 flex items-center justify-center">
                      <div className="w-3 h-3 border-b-2 border-r-2 border-green-700 rotate-45"></div>
                    </div>
                    <span>Gravity Block: Pulls all blocks down</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-tetris-turquoise/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-tetris-turquoise">Room Leaderboard</CardTitle>
                {(!isSupabaseConfigured || dbError) && (
                  <CardDescription className="text-amber-500">
                    Using demo data (Supabase not configured or database tables missing)
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Leaderboard roomId={params.id} currentPlayerName={username} refreshInterval={2000} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Card className="w-full max-w-md mb-6 border-tetris-red/50">
            <CardHeader>
              <CardTitle className="text-tetris-red">Game Over</CardTitle>
              <CardDescription>
                Your final score: <span className="text-tetris-red font-bold">{score}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Leaderboard roomId={params.id} currentPlayerName={username} refreshInterval={2000} />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={handlePlayAgain} className="bg-tetris-turquoise hover:bg-tetris-darkTurquoise">
              Play Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="border-tetris-red text-tetris-red hover:bg-tetris-red/10"
            >
              Back to Home
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
