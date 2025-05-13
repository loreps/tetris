import Link from "next/link"
import { Button } from "@/components/ui/button"
import ActiveRooms from "@/components/active-rooms"
import GlobalLeaderboard from "@/components/global-leaderboard"
import GameRules from "@/components/game-rules"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

function ErrorFallback() {
  return (
    <div className="p-4 border border-red-300 bg-red-50 rounded-md">
      <h2 className="text-red-700 font-medium mb-2">Something went wrong</h2>
      <p className="text-red-600 text-sm">There was an error loading this component</p>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="container flex flex-col py-8 space-y-8">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-tetris-turquoise to-tetris-red bg-clip-text text-transparent mb-4">
          Linera Tetris
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create your own room with custom rules or join an existing one
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <Link href="/create-room">
            <Button size="lg" className="w-full sm:w-auto bg-tetris-turquoise hover:bg-tetris-darkTurquoise">
              Create Room
            </Button>
          </Link>
          <Link href="/join-room">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-tetris-red text-tetris-red hover:bg-tetris-red/10"
            >
              Join Room
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<div className="h-64 w-full bg-muted/20 animate-pulse rounded-lg"></div>}>
            <ActiveRooms />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<div className="h-64 w-full bg-muted/20 animate-pulse rounded-lg"></div>}>
            <GlobalLeaderboard />
          </Suspense>
        </ErrorBoundary>
      </div>

      <GameRules />
    </div>
  )
}
