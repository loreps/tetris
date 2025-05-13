"use client"

import { useEffect, useState } from "react"
import { getRoomLeaderboard, isSupabaseConfigured } from "@/utils/supabase"

interface LeaderboardProps {
  roomId: string
  currentPlayerName: string
  refreshInterval?: number
}

type LeaderboardEntry = {
  id: number
  room_id: string
  player_id: string
  score: number
  player: {
    id: string
    nickname: string
  }
}

export default function Leaderboard({ roomId, currentPlayerName, refreshInterval = 2000 }: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      setIsLoading(false)

      // Use dummy data if Supabase is not available
      setLeaderboardData([
        {
          id: 1,
          room_id: roomId,
          player_id: "player1",
          score: 12500,
          player: { id: "player1", nickname: "Player 1" },
        },
        {
          id: 2,
          room_id: roomId,
          player_id: "player2",
          score: 9800,
          player: { id: "player2", nickname: "Player 2" },
        },
        {
          id: 3,
          room_id: roomId,
          player_id: "player3",
          score: 7200,
          player: { id: "player3", nickname: "Player 3" },
        },
        {
          id: 4,
          room_id: roomId,
          player_id: "player4",
          score: 5600,
          player: { id: "player4", nickname: "Player 4" },
        },
        {
          id: 5,
          room_id: roomId,
          player_id: "player5",
          score: 3100,
          player: { id: "player5", nickname: "Player 5" },
        },
      ])
      return
    }

    // Initial fetch
    fetchLeaderboard()

    // Set up interval for periodic updates
    const intervalId = setInterval(fetchLeaderboard, refreshInterval)

    // Clean up on unmount
    return () => clearInterval(intervalId)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, refreshInterval])

  const fetchLeaderboard = async () => {
    if (!isSupabaseConfigured) return

    try {
      const data = await getRoomLeaderboard(roomId)
      setLeaderboardData(data as LeaderboardEntry[])
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
      setIsLoading(false)
    }
  }

  // Format data for display
  const displayData = leaderboardData.map((entry) => ({
    name: entry.player?.nickname === currentPlayerName ? "You" : entry.player?.nickname || "Unknown Player",
    score: entry.score,
    isCurrentPlayer: entry.player?.nickname === currentPlayerName,
  }))

  // If current player is not in the leaderboard, add them with score 0
  if (!displayData.some((player) => player.isCurrentPlayer) && currentPlayerName) {
    displayData.push({
      name: "You",
      score: 0,
      isCurrentPlayer: true,
    })
  }

  // Sort by score (highest first)
  displayData.sort((a, b) => b.score - a.score)

  if (isLoading) {
    return <div className="text-center py-4">Loading leaderboard...</div>
  }

  return (
    <div className="w-full">
      {!isSupabaseConfigured && (
        <div className="text-amber-500 text-xs mb-2 p-1 bg-amber-50 rounded">
          Using demo data (Supabase not configured)
        </div>
      )}

      <div className="grid grid-cols-12 font-medium text-sm mb-2 border-b pb-2 border-tetris-turquoise/30">
        <div className="col-span-1">#</div>
        <div className="col-span-7">Player</div>
        <div className="col-span-4 text-right">Score</div>
      </div>

      {displayData.map((entry, index) => (
        <div
          key={index}
          className={`grid grid-cols-12 py-2 text-sm ${
            entry.isCurrentPlayer ? "bg-tetris-turquoise/10 font-medium" : ""
          } ${index % 2 === 0 ? "bg-muted/30" : ""}`}
        >
          <div className="col-span-1 text-tetris-red">{index + 1}</div>
          <div className="col-span-7">{entry.name}</div>
          <div className="col-span-4 text-right text-tetris-turquoise font-medium">{entry.score.toLocaleString()}</div>
        </div>
      ))}

      {displayData.length === 0 && <div className="text-center py-4 text-muted-foreground">No players yet</div>}
    </div>
  )
}
