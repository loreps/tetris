"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getActiveRooms, getRoomPlayerCount, isSupabaseConfigured } from "@/utils/supabase"
import { Clock, Users } from "lucide-react"
import { ErrorBoundary } from "react-error-boundary"

type RoomWithPlayerCount = {
  id: string
  name: string
  game_time: number
  difficulty: number
  special_block_frequency: number
  created_at: string
  expires_at: string
  player_count: number
  time_remaining?: number
}

function ErrorFallback() {
  return (
    <Card className="w-full border-tetris-red/30">
      <CardHeader>
        <CardTitle className="text-tetris-red">Active Rooms</CardTitle>
        <CardDescription>Unable to load active rooms</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center py-4 text-muted-foreground">
          There was an error loading the active rooms. Please try again later.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/create-room">
          <Button className="bg-tetris-turquoise hover:bg-tetris-darkTurquoise">Create Room</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

function ActiveRoomsContent() {
  const [rooms, setRooms] = useState<RoomWithPlayerCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      setIsLoading(false)

      // Use dummy data if Supabase is not available
      setRooms([
        {
          id: "ABC123",
          name: "Quick Game",
          game_time: 180,
          difficulty: 3,
          special_block_frequency: 20,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 180000).toISOString(),
          player_count: 3,
          time_remaining: 120,
        },
        {
          id: "DEF456",
          name: "Hard Level",
          game_time: 300,
          difficulty: 8,
          special_block_frequency: 30,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 300000).toISOString(),
          player_count: 2,
          time_remaining: 240,
        },
        {
          id: "GHI789",
          name: "Marathon",
          game_time: 600,
          difficulty: 5,
          special_block_frequency: 15,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 600000).toISOString(),
          player_count: 5,
          time_remaining: 450,
        },
      ])
      return
    }

    fetchRooms()

    // Refresh rooms every 10 seconds
    const interval = setInterval(fetchRooms, 10000)

    return () => clearInterval(interval)
  }, [])

  const fetchRooms = async () => {
    if (!isSupabaseConfigured) return

    try {
      setIsLoading(true)
      setError(null)

      // Get active rooms from Supabase
      const roomsData = await getActiveRooms()

      // Get player count for each room
      const roomsWithPlayerCount = await Promise.all(
        roomsData.map(async (room) => {
          try {
            const playerCount = await getRoomPlayerCount(room.id)

            // Calculate time remaining
            const now = Date.now()
            const expiresAt = new Date(room.expires_at).getTime()
            const timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000))

            return {
              ...room,
              player_count: playerCount,
              time_remaining: timeRemaining,
            }
          } catch (err) {
            console.error(`Error getting player count for room ${room.id}:`, err)
            return {
              ...room,
              player_count: 0,
              time_remaining: 0,
            }
          }
        }),
      )

      // Filter out rooms that have expired
      const activeRooms = roomsWithPlayerCount.filter((room) => room.time_remaining > 0)

      setRooms(activeRooms)
    } catch (err) {
      console.error("Error fetching rooms:", err)
      setError(err instanceof Error ? err : new Error("Unknown error fetching rooms"))
      // Use empty array to avoid breaking the UI
      setRooms([])
    } finally {
      setIsLoading(false)
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (isLoading) {
    return (
      <Card className="w-full border-tetris-turquoise/30">
        <CardHeader>
          <CardTitle className="text-tetris-turquoise">Active Rooms</CardTitle>
          <CardDescription>Loading available rooms...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tetris-turquoise mb-4"></div>
            <p>Loading rooms...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full border-tetris-red/30">
        <CardHeader>
          <CardTitle className="text-tetris-red">Error Loading Rooms</CardTitle>
          <CardDescription>There was a problem loading the active rooms</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4 text-muted-foreground">Unable to load active rooms. Please try again later.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/create-room">
            <Button className="bg-tetris-turquoise hover:bg-tetris-darkTurquoise">Create Room</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (rooms.length === 0) {
    return (
      <Card className="w-full border-tetris-turquoise/30">
        <CardHeader>
          <CardTitle className="text-tetris-turquoise">Active Rooms</CardTitle>
          <CardDescription>There are no active rooms at the moment</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4 text-muted-foreground">Create a new room to start playing!</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/create-room">
            <Button className="bg-tetris-turquoise hover:bg-tetris-darkTurquoise">Create Room</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full border-tetris-turquoise/30">
      <CardHeader>
        <CardTitle className="text-tetris-turquoise">Active Rooms</CardTitle>
        <CardDescription>Join existing rooms or create your own</CardDescription>
      </CardHeader>
      <CardContent>
        {!isSupabaseConfigured && (
          <div className="text-amber-500 text-xs mb-4 p-2 bg-amber-50 rounded">
            Using demo data (Supabase not configured)
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className="border-tetris-red/30 hover:border-tetris-red transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-tetris-red">{room.name}</CardTitle>
                <CardDescription className="flex justify-between items-center">
                  <span>ID: {room.id}</span>
                  <span className="text-tetris-turquoise">Difficulty: {room.difficulty}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between text-sm mb-1">
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-tetris-red" />
                    <span>{room.time_remaining ? formatTime(room.time_remaining) : formatTime(room.game_time)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-tetris-turquoise" />
                    <span>{room.player_count} players</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Special blocks: {room.special_block_frequency}%</div>
              </CardContent>
              <CardFooter>
                <Link href={`/room/${room.id}`} className="w-full">
                  <Button variant="outline" className="w-full border-tetris-red text-tetris-red hover:bg-tetris-red/10">
                    Join
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/create-room">
          <Button className="bg-tetris-turquoise hover:bg-tetris-darkTurquoise">Create New Room</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function ActiveRooms() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ActiveRoomsContent />
    </ErrorBoundary>
  )
}
