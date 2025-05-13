"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { createRoom, isSupabaseConfigured } from "@/utils/supabase"

export default function CreateRoomPage() {
  const router = useRouter()
  const [roomName, setRoomName] = useState("")
  const [gameTime, setGameTime] = useState(5)
  const [difficulty, setDifficulty] = useState(1)
  const [specialBlockFrequency, setSpecialBlockFrequency] = useState(15)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateRoom = async () => {
    setIsCreating(true)

    try {
      // Generate a random room ID
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()

      // Validate inputs
      const validatedRoomName = roomName.trim() || `Room ${roomId}`
      const validatedGameTime = Math.max(1, gameTime) * 60 // Convert to seconds, ensure at least 1 minute
      const validatedDifficulty = Math.max(1, Math.min(10, difficulty)) // Ensure between 1-10
      const validatedSpecialBlockFrequency = Math.max(0, Math.min(50, specialBlockFrequency)) // Ensure between 0-50%

      // Create room config for localStorage (for compatibility)
      const roomConfig = {
        id: roomId,
        name: validatedRoomName,
        gameTime: validatedGameTime,
        difficulty: validatedDifficulty,
        specialBlockFrequency: validatedSpecialBlockFrequency,
        createdAt: new Date().toISOString(),
      }

      // Save to localStorage for compatibility
      localStorage.setItem(`room_${roomId}`, JSON.stringify(roomConfig))

      // If Supabase is available, also save to database
      if (isSupabaseConfigured) {
        await createRoom({
          id: roomId,
          name: validatedRoomName,
          game_time: validatedGameTime,
          difficulty: validatedDifficulty,
          special_block_frequency: validatedSpecialBlockFrequency,
        })
      }

      // Navigate to the game room
      router.push(`/room/${roomId}`)
    } catch (error) {
      console.error("Error creating room:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container max-w-md py-12">
      <Card className="border-tetris-turquoise/50">
        <CardHeader>
          <CardTitle className="text-tetris-turquoise">Create a New Room</CardTitle>
          <CardDescription>Set up custom rules for your Tetris game</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              placeholder="My Tetris Room"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="focus-visible:ring-tetris-turquoise"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="game-time">
              Game Time (minutes): <span className="text-tetris-red">{gameTime}</span>
            </Label>
            <Slider
              id="game-time"
              min={1}
              max={30}
              step={1}
              value={[gameTime]}
              onValueChange={(value) => setGameTime(value[0])}
              className="[&>span]:bg-tetris-red"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">
              Difficulty Level: <span className="text-tetris-turquoise">{difficulty}</span>
            </Label>
            <Slider
              id="difficulty"
              min={1}
              max={10}
              step={1}
              value={[difficulty]}
              onValueChange={(value) => setDifficulty(value[0])}
              className="[&>span]:bg-tetris-turquoise"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="special-block-frequency">
              Special Block Frequency: <span className="text-tetris-red">{specialBlockFrequency}%</span>
            </Label>
            <Slider
              id="special-block-frequency"
              min={0}
              max={50}
              step={5}
              value={[specialBlockFrequency]}
              onValueChange={(value) => setSpecialBlockFrequency(value[0])}
              className="[&>span]:bg-tetris-red"
            />
            <p className="text-xs text-muted-foreground">
              {specialBlockFrequency === 0
                ? "No special blocks will appear"
                : `Special blocks will appear with ${specialBlockFrequency}% probability`}
            </p>
          </div>

          <Button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full bg-tetris-turquoise hover:bg-tetris-darkTurquoise mt-4"
          >
            {isCreating ? "Creating Room..." : "Create Room"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
