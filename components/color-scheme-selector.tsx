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
import { PaletteIcon } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

// Define color schemes
export const COLOR_SCHEMES = {
  classic: {
    I: "bg-cyan-500",
    J: "bg-blue-500",
    L: "bg-orange-500",
    O: "bg-yellow-500",
    S: "bg-green-500",
    T: "bg-purple-500",
    Z: "bg-red-500",
  },
  neon: {
    I: "bg-[#00FFFF]",
    J: "bg-[#0000FF]",
    L: "bg-[#FF8800]",
    O: "bg-[#FFFF00]",
    S: "bg-[#00FF00]",
    T: "bg-[#FF00FF]",
    Z: "bg-[#FF0000]",
  },
  pastel: {
    I: "bg-sky-300",
    J: "bg-indigo-300",
    L: "bg-amber-300",
    O: "bg-yellow-200",
    S: "bg-emerald-300",
    T: "bg-violet-300",
    Z: "bg-rose-300",
  },
  monochrome: {
    I: "bg-gray-300",
    J: "bg-gray-400",
    L: "bg-gray-500",
    O: "bg-gray-600",
    S: "bg-gray-700",
    T: "bg-gray-800",
    Z: "bg-gray-900",
  },
  redTurquoise: {
    I: "bg-tetris-turquoise",
    J: "bg-tetris-darkTurquoise",
    L: "bg-tetris-red",
    O: "bg-tetris-lightRed",
    S: "bg-tetris-turquoise/70",
    T: "bg-tetris-red/70",
    Z: "bg-tetris-red",
  },
}

export type ColorSchemeName = keyof typeof COLOR_SCHEMES

export default function ColorSchemeSelector() {
  const [open, setOpen] = useState(false)
  const [selectedScheme, setSelectedScheme] = useState<ColorSchemeName>("classic")

  // Load selected color scheme from localStorage on component mount
  useEffect(() => {
    const savedScheme = localStorage.getItem("tetris_color_scheme") as ColorSchemeName | null
    if (savedScheme && COLOR_SCHEMES[savedScheme]) {
      setSelectedScheme(savedScheme)
    }
  }, [])

  const handleSaveScheme = () => {
    localStorage.setItem("tetris_color_scheme", selectedScheme)
    setOpen(false)
  }

  // Preview of the color scheme
  const renderColorPreview = (scheme: ColorSchemeName) => {
    const colors = COLOR_SCHEMES[scheme]
    return (
      <div className="flex gap-1 mt-1">
        {Object.values(colors).map((color, index) => (
          <div key={index} className={`w-4 h-4 ${color} rounded-sm`}></div>
        ))}
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
          <PaletteIcon size={16} />
          Color Scheme
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-tetris-turquoise">
        <DialogHeader>
          <DialogTitle className="text-tetris-turquoise">Tetromino Color Scheme</DialogTitle>
          <DialogDescription>Choose a color scheme for your Tetris pieces.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup
            value={selectedScheme}
            onValueChange={(value) => setSelectedScheme(value as ColorSchemeName)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="classic" id="classic" className="border-tetris-turquoise text-tetris-turquoise" />
              <Label htmlFor="classic" className="flex flex-col">
                Classic
                {renderColorPreview("classic")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="neon" id="neon" className="border-tetris-turquoise text-tetris-turquoise" />
              <Label htmlFor="neon" className="flex flex-col">
                Neon
                {renderColorPreview("neon")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pastel" id="pastel" className="border-tetris-turquoise text-tetris-turquoise" />
              <Label htmlFor="pastel" className="flex flex-col">
                Pastel
                {renderColorPreview("pastel")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="monochrome"
                id="monochrome"
                className="border-tetris-turquoise text-tetris-turquoise"
              />
              <Label htmlFor="monochrome" className="flex flex-col">
                Monochrome
                {renderColorPreview("monochrome")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="redTurquoise"
                id="redTurquoise"
                className="border-tetris-turquoise text-tetris-turquoise"
              />
              <Label htmlFor="redTurquoise" className="flex flex-col">
                Red & Turquoise
                {renderColorPreview("redTurquoise")}
              </Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSaveScheme}
            className="bg-tetris-turquoise hover:bg-tetris-darkTurquoise"
          >
            Save Preference
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
