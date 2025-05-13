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
import { LayoutGridIcon } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

// Define board themes
export const BOARD_THEMES = {
  classic: {
    background: "bg-gray-900",
    border: "border-tetris-turquoise border-2",
    cell: "border-gray-800",
  },
  grid: {
    background:
      "bg-gray-900 bg-[linear-gradient(#333_1px,transparent_1px),linear-gradient(90deg,#333_1px,transparent_1px)] bg-[size:10px_10px]",
    border: "border-tetris-red border-2",
    cell: "border-gray-700",
  },
  gradient: {
    background: "bg-gradient-to-b from-gray-900 to-gray-800",
    border: "border-gradient-to-r from-tetris-turquoise to-tetris-red border-2",
    cell: "border-gray-700/50",
  },
  neon: {
    background: "bg-black",
    border: "border-tetris-turquoise border-2 shadow-[0_0_10px_#40E0D0]",
    cell: "border-tetris-turquoise/20",
  },
  minimal: {
    background: "bg-gray-950",
    border: "border-white/10 border",
    cell: "border-transparent",
  },
  redTurquoise: {
    background: "bg-gradient-to-br from-tetris-red/5 to-tetris-turquoise/5",
    border: "border-2 border-gradient-to-r from-tetris-red to-tetris-turquoise",
    cell: "border-white/5",
  },
}

export type BoardThemeName = keyof typeof BOARD_THEMES

export default function BoardThemeSelector() {
  const [open, setOpen] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<BoardThemeName>("classic")

  // Load selected board theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("tetris_board_theme") as BoardThemeName | null
    if (savedTheme && BOARD_THEMES[savedTheme]) {
      setSelectedTheme(savedTheme)
    }
  }, [])

  const handleSaveTheme = () => {
    localStorage.setItem("tetris_board_theme", selectedTheme)
    setOpen(false)

    // Dispatch a custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("boardthemechange", {
        detail: { theme: selectedTheme },
      }),
    )
  }

  // Preview of the board theme
  const renderThemePreview = (theme: BoardThemeName) => {
    const themeStyles = BOARD_THEMES[theme]
    return (
      <div className={`mt-1 w-16 h-10 ${themeStyles.background} ${themeStyles.border} overflow-hidden`}>
        <div className="grid grid-cols-4 grid-rows-2 h-full w-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`${i % 2 === 0 ? "bg-tetris-turquoise/30" : "bg-tetris-red/30"} ${themeStyles.cell} border`}
            ></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-tetris-turquoise text-tetris-turquoise hover:bg-tetris-turquoise/10"
        >
          <LayoutGridIcon size={16} />
          Board Theme
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-tetris-red">
        <DialogHeader>
          <DialogTitle className="text-tetris-red">Game Board Theme</DialogTitle>
          <DialogDescription>Choose a theme for your Tetris game board.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup
            value={selectedTheme}
            onValueChange={(value) => setSelectedTheme(value as BoardThemeName)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="classic" id="board-classic" className="border-tetris-red text-tetris-red" />
              <Label htmlFor="board-classic" className="flex flex-col">
                Classic
                {renderThemePreview("classic")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="grid" id="board-grid" className="border-tetris-red text-tetris-red" />
              <Label htmlFor="board-grid" className="flex flex-col">
                Grid
                {renderThemePreview("grid")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="gradient" id="board-gradient" className="border-tetris-red text-tetris-red" />
              <Label htmlFor="board-gradient" className="flex flex-col">
                Gradient
                {renderThemePreview("gradient")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="neon" id="board-neon" className="border-tetris-red text-tetris-red" />
              <Label htmlFor="board-neon" className="flex flex-col">
                Neon
                {renderThemePreview("neon")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="minimal" id="board-minimal" className="border-tetris-red text-tetris-red" />
              <Label htmlFor="board-minimal" className="flex flex-col">
                Minimal
                {renderThemePreview("minimal")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="redTurquoise"
                id="board-redTurquoise"
                className="border-tetris-red text-tetris-red"
              />
              <Label htmlFor="board-redTurquoise" className="flex flex-col">
                Red & Turquoise
                {renderThemePreview("redTurquoise")}
              </Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSaveTheme} className="bg-tetris-red hover:bg-tetris-lightRed">
            Save Preference
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
