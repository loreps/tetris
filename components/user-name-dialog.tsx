"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserIcon } from "lucide-react"

export default function UserNameDialog() {
  const [username, setUsername] = useState("")
  const [currentUsername, setCurrentUsername] = useState("")
  const [open, setOpen] = useState(false)

  // Load username from localStorage on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("tetris_username")
    if (savedUsername) {
      setCurrentUsername(savedUsername)
    }
  }, [])

  const handleSaveUsername = () => {
    if (username.trim()) {
      localStorage.setItem("tetris_username", username.trim())
      setCurrentUsername(username.trim())
      setUsername("")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-tetris-red text-tetris-red hover:bg-tetris-red/10">
          <UserIcon size={16} />
          {currentUsername ? currentUsername : "Set Username"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-tetris-turquoise">
        <DialogHeader>
          <DialogTitle className="text-tetris-turquoise">Username</DialogTitle>
          <DialogDescription>Set your username to display on the Linera Tetris leaderboard.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Name
            </Label>
            <Input
              id="username"
              placeholder={currentUsername || "Enter username"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3 focus-visible:ring-tetris-turquoise"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveUsername()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSaveUsername}
            className="bg-tetris-turquoise hover:bg-tetris-darkTurquoise"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
