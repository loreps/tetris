"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function JoinRoomPage() {
  const router = useRouter()
  const [roomId, setRoomId] = useState("")
  const [error, setError] = useState("")

  const handleJoinRoom = () => {
    if (!roomId) {
      setError("Please enter a room ID")
      return
    }

    // In a real app, you would check if the room exists in the database
    const roomData = localStorage.getItem(`room_${roomId}`)

    if (!roomData) {
      setError("Room not found")
      return
    }

    router.push(`/room/${roomId}`)
  }

  return (
    <div className="container max-w-md py-12">
      <Card className="border-tetris-red/50">
        <CardHeader>
          <CardTitle className="text-tetris-red">Join a Room</CardTitle>
          <CardDescription>Enter a room ID to join an existing game</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-id">Room ID</Label>
            <Input
              id="room-id"
              placeholder="Enter room ID"
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value.toUpperCase())
                setError("")
              }}
              className="focus-visible:ring-tetris-red"
            />
            {error && <p className="text-sm text-tetris-red">{error}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full bg-tetris-red hover:bg-tetris-lightRed" onClick={handleJoinRoom}>
            Join Room
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
