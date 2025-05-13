"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getGlobalLeaderboard, isSupabaseConfigured } from "@/utils/supabase"
import { Trophy } from "lucide-react"
import { ErrorBoundary } from "react-error-boundary"

type LeaderboardEntry = {
  id: number
  room_id: string
  player_id: string
  score: number
  player: {
    id: string
    nickname: string
  }
  room: {
    id: string
    name: string
  }
}

function ErrorFallback() {
  return (
    <Card className="w-full border-tetris-red/30">
      <CardHeader>
        <CardTitle className="text-tetris-red flex items-center gap-2">
          <Trophy size={20} />
          Global Leaderboard
        </CardTitle>
        <CardDescription>Unable to load leaderboard data</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center py-4 text-muted-foreground">
          There was an error loading the leaderboard. Please try again later.
        </p>
      </CardContent>
    </Card>
  )
}

function GlobalLeaderboardContent() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      setIsLoading(false)

      // Use dummy data if Supabase is not available
      setLeaderboard([
        {
          id: 1,
          room_id: "ABC123",
          player_id: "player1",
          score: 24500,
          player: { id: "player1", nickname: "Champion" },
          room: { id: "ABC123", name: "Quick Game" },
        },
        {
          id: 2,
          room_id: "DEF456",
          player_id: "player2",
          score: 18900,
          player: { id: "player2", nickname: "TetrisMaster" },
          room: { id: "DEF456", name: "Hard Level" },
        },
        {
          id: 3,
          room_id: "GHI789",
          player_id: "player3",
          score: 15700,
          player: { id: "player3", nickname: "BlockStacker" },
          room: { id: "GHI789", name: "Marathon" },
        },
        {
          id: 4,
          room_id: "ABC123",
          player_id: "player4",
          score: 12300,
          player: { id: "player4", nickname: "LineClearer" },
          room: { id: "ABC123", name: "Quick Game" },
        },
        {
          id: 5,
          room_id: "DEF456",
          player_id: "player5",
          score: 9800,
          player: { id: "player5", nickname: "TetroNinja" },
          room: { id: "DEF456", name: "Hard Level" },
        },
      ])
      return
    }

    fetchLeaderboard()

    // Refresh leaderboard every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchLeaderboard = async () => {
    if (!isSupabaseConfigured) return

    try {
      setIsLoading(true)
      setError(null)

      // Fetch top players from Supabase
      const data = await getGlobalLeaderboard(10)
      setLeaderboard(data as LeaderboardEntry[])
    } catch (err) {
      console.error("Error fetching leaderboard:", err)
      setError(err instanceof Error ? err : new Error("Unknown error fetching leaderboard"))
      // Use empty array to avoid breaking the UI
      setLeaderboard([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full border-tetris-red/30">
        <CardHeader>
          <CardTitle className="text-tetris-red flex items-center gap-2">
            <Trophy size={20} />
            Global Leaderboard
          </CardTitle>
          <CardDescription>Loading top players...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tetris-red mb-4"></div>
            <p>Loading leaderboard...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full border-tetris-red/30">
        <CardHeader>
          <CardTitle className="text-tetris-red flex items-center gap-2">
            <Trophy size={20} />
            Global Leaderboard
          </CardTitle>
          <CardDescription>Error loading leaderboard</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4 text-muted-foreground">
            Unable to load leaderboard data. Please try again later.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-tetris-red/30">
      <CardHeader>
        <CardTitle className="text-tetris-red flex items-center gap-2">
          <Trophy size={20} />
          Global Leaderboard
        </CardTitle>
        <CardDescription>Top players from all rooms</CardDescription>
      </CardHeader>
      <CardContent>
        {!isSupabaseConfigured && (
          <div className="text-amber-500 text-xs mb-4 p-2 bg-amber-50 rounded">
            Using demo data (Supabase not configured)
          </div>
        )}

        <div className="grid grid-cols-12 font-medium text-sm mb-2 border-b pb-2 border-tetris-red/30">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Player</div>
          <div className="col-span-4">Room</div>
          <div className="col-span-3 text-right">Score</div>
        </div>

        {leaderboard.map((entry, index) => (
          <div key={index} className={`grid grid-cols-12 py-2 text-sm ${index % 2 === 0 ? "bg-muted/30" : ""}`}>
            <div className="col-span-1 text-tetris-red font-bold">{index + 1}</div>
            <div className="col-span-4">{entry.player?.nickname || "Unknown Player"}</div>
            <div className="col-span-4 text-muted-foreground">{entry.room?.name || "Unknown Room"}</div>
            <div className="col-span-3 text-right text-tetris-turquoise font-medium">
              {entry.score.toLocaleString()}
            </div>
          </div>
        ))}

        {leaderboard.length === 0 && <div className="text-center py-4 text-muted-foreground">No results yet</div>}
      </CardContent>
    </Card>
  )
}

export default function GlobalLeaderboard() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <GlobalLeaderboardContent />
    </ErrorBoundary>
  )
}
