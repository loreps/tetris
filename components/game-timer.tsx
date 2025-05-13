"use client"

import { useEffect, useState, useRef } from "react"

interface GameTimerProps {
  initialTime: number
  onTimeUp: () => void
  setTimeRemaining: (time: number) => void
}

export default function GameTimer({ initialTime, onTimeUp, setTimeRemaining }: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  const initializedRef = useRef(false)

  // Initialize and start timer
  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) return
    initializedRef.current = true

    // Set initial time
    setTimeLeft(initialTime)

    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1

        // Update parent component
        setTimeRemaining(newTime)

        // Check if time is up
        if (newTime <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }

          // Only trigger time up if component is still mounted
          if (mountedRef.current) {
            onTimeUp()
          }

          return 0
        }

        return newTime
      })
    }, 1000)

    // Clean up on unmount
    return () => {
      mountedRef.current = false
      initializedRef.current = false

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [initialTime, onTimeUp, setTimeRemaining])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div
      className={`font-mono text-lg ${
        timeLeft < 30
          ? "text-tetris-red animate-pulse"
          : timeLeft < 60
            ? "text-tetris-lightRed"
            : "text-tetris-turquoise"
      }`}
    >
      {formatTime(timeLeft)}
    </div>
  )
}
