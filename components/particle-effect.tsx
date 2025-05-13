"use client"

import { useEffect, useState, useRef } from "react"

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  speedX: number
  speedY: number
  opacity: number
}

interface ParticleEffectProps {
  x: number
  y: number
  color: string
  count?: number
  duration?: number
  onComplete?: () => void
}

export default function ParticleEffect({ x, y, color, count = 30, duration = 1000, onComplete }: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const animationRef = useRef<number | null>(null)
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    // Create particles
    const newParticles: Particle[] = []

    // Extract the actual color from Tailwind classes
    let actualColor = "#FFFFFF" // Default white

    if (color.includes("bg-")) {
      // Handle Tailwind color classes
      if (color.includes("red")) actualColor = "#E63946"
      else if (color.includes("blue")) actualColor = "#0000FF"
      else if (color.includes("cyan")) actualColor = "#00FFFF"
      else if (color.includes("green")) actualColor = "#00FF00"
      else if (color.includes("yellow")) actualColor = "#FFFF00"
      else if (color.includes("orange")) actualColor = "#FF8800"
      else if (color.includes("purple")) actualColor = "#FF00FF"
      else if (color.includes("tetris-turquoise")) actualColor = "#40E0D0"
      else if (color.includes("tetris-red")) actualColor = "#E63946"
    }

    // Limit the number of particles based on device performance
    // Significantly reduce particle count for better performance
    const actualCount = Math.min(count, window.innerWidth < 768 ? 5 : 10)

    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.5 + Math.random() * 1.5 // Reduced speed

      newParticles.push({
        id: i,
        x,
        y,
        size: 1 + Math.random() * 2, // Smaller particles
        color: actualColor,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        opacity: 1,
      })
    }

    setParticles(newParticles)

    // Use a shorter duration to ensure animation completes quickly
    const actualDuration = Math.min(duration, 500) // Reduced max duration to 500ms
    const startTime = Date.now()
    let lastUpdateTime = startTime

    const animateParticles = () => {
      if (isUnmountedRef.current) return

      const currentTime = Date.now()
      const elapsed = currentTime - startTime

      // Only update if enough time has passed (throttle updates)
      if (currentTime - lastUpdateTime > 16) {
        // ~60fps
        lastUpdateTime = currentTime

        if (elapsed < actualDuration) {
          setParticles((prevParticles) =>
            prevParticles.map((particle) => ({
              ...particle,
              x: particle.x + particle.speedX,
              y: particle.y + particle.speedY,
              opacity: Math.max(0, 1 - elapsed / actualDuration),
            })),
          )
        } else {
          // Ensure we clean up properly
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = null
          }
          setParticles([])
          if (onComplete) onComplete()
          return
        }
      }

      animationRef.current = requestAnimationFrame(animateParticles)
    }

    animationRef.current = requestAnimationFrame(animateParticles)

    // Force cleanup after a maximum time to prevent hanging animations
    // Use a shorter timeout that's just slightly longer than the animation duration
    cleanupTimeoutRef.current = setTimeout(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      setParticles([])
      if (onComplete && !isUnmountedRef.current) onComplete()
    }, actualDuration + 50) // Add a small buffer

    return () => {
      isUnmountedRef.current = true
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current)
        cleanupTimeoutRef.current = null
      }
      // Ensure onComplete is called on unmount to clean up parent references
      if (onComplete) onComplete()
    }
  }, [x, y, color, count, duration, onComplete])

  // Don't render anything if there are no particles
  if (particles.length === 0) return null

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            transform: `scale(${1 - (1 - particle.opacity) * 0.5})`,
            boxShadow: `0 0 ${particle.size / 2}px ${particle.color}`, // Smaller shadow
          }}
        />
      ))}
    </div>
  )
}
