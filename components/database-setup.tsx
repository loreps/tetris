"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase, isSupabaseConfigured } from "@/utils/supabase"
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"

export default function DatabaseSetup() {
  const [isChecking, setIsChecking] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [status, setStatus] = useState<"unchecked" | "exists" | "missing" | "created" | "error" | "no_connection">(
    "unchecked",
  )
  const [errorMessage, setErrorMessage] = useState("")
  const [tableStatus, setTableStatus] = useState({
    rooms: false,
    players: false,
    room_leaderboard: false,
  })

  // Check environment variables on mount
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("no_connection")
      setErrorMessage(
        "Supabase environment variables are missing. Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
      )
    } else {
      // Auto-check tables on mount if Supabase is configured
      checkTable()
    }
  }, [])

  const checkDatabaseStructure = async () => {
    if (!isSupabaseConfigured) {
      return
    }

    try {
      // Check rooms table
      const { data: roomsData, error: roomsError } = await supabase.from("rooms").select("count").limit(1)
      setTableStatus((prev) => ({ ...prev, rooms: !roomsError }))

      // Check players table
      const { data: playersData, error: playersError } = await supabase.from("players").select("count").limit(1)
      setTableStatus((prev) => ({ ...prev, players: !playersError }))

      // Check room_leaderboard table
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from("room_leaderboard")
        .select("count")
        .limit(1)
      setTableStatus((prev) => ({ ...prev, room_leaderboard: !leaderboardError }))

      // Log table structure if available
      if (roomsData) console.log("Rooms table exists")
      if (playersData) console.log("Players table exists")
      if (leaderboardData) console.log("Room leaderboard table exists")

      // Determine overall status
      if (!roomsError && !playersError && !leaderboardError) {
        setStatus("exists")
      } else {
        setStatus("missing")
      }
    } catch (error) {
      console.error("Error checking database structure:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const checkTable = async () => {
    if (!isSupabaseConfigured) {
      setStatus("no_connection")
      setErrorMessage(
        "Supabase environment variables are missing. Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
      )
      return
    }

    setIsChecking(true)
    setStatus("unchecked")
    setErrorMessage("")

    try {
      // Check database structure
      await checkDatabaseStructure()
    } catch (error) {
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setIsChecking(false)
    }
  }

  const createTable = async () => {
    if (!isSupabaseConfigured) {
      setStatus("no_connection")
      setErrorMessage(
        "Supabase environment variables are missing. Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
      )
      return
    }

    setIsCreating(true)
    setErrorMessage("")

    try {
      // Create the tables using the API route
      const response = await fetch("/api/create-table", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create tables")
      }

      // Verify tables were created
      await checkDatabaseStructure()
      setStatus("created")
    } catch (error) {
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Database Setup</CardTitle>
        <CardDescription>Check and set up the database for the Tetris leaderboard</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span>Environment Variables:</span>
              {isSupabaseConfigured ? (
                <span className="text-green-500 flex items-center gap-1">
                  <CheckCircle2 size={16} /> Present
                </span>
              ) : (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertCircle size={16} /> Missing
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span>Database Status:</span>
              {status === "unchecked" && <span className="text-muted-foreground">Not checked yet</span>}
              {status === "exists" && (
                <span className="text-green-500 flex items-center gap-1">
                  <CheckCircle2 size={16} /> Ready
                </span>
              )}
              {status === "missing" && (
                <span className="text-amber-500 flex items-center gap-1">
                  <AlertTriangle size={16} /> Tables need to be created
                </span>
              )}
              {status === "created" && (
                <span className="text-green-500 flex items-center gap-1">
                  <CheckCircle2 size={16} /> Tables created successfully
                </span>
              )}
              {status === "error" && (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertCircle size={16} /> Error
                </span>
              )}
              {status === "no_connection" && (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertCircle size={16} /> No connection
                </span>
              )}
            </div>

            {isSupabaseConfigured && (
              <div className="mt-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>Rooms table:</div>
                  <div>
                    {tableStatus.rooms ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Exists
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1">
                        <AlertTriangle size={14} /> Missing
                      </span>
                    )}
                  </div>

                  <div>Players table:</div>
                  <div>
                    {tableStatus.players ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Exists
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1">
                        <AlertTriangle size={14} /> Missing
                      </span>
                    )}
                  </div>

                  <div>Leaderboard table:</div>
                  <div>
                    {tableStatus.room_leaderboard ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Exists
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1">
                        <AlertTriangle size={14} /> Missing
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="text-sm text-red-500 p-2 bg-red-50 rounded border border-red-200">{errorMessage}</div>
          )}

          {status === "created" && (
            <div className="text-sm text-green-500 p-2 bg-green-50 rounded border border-green-200">
              Database is set up and ready to use!
            </div>
          )}

          {!isSupabaseConfigured ? (
            <div className="text-sm p-2 bg-amber-50 rounded border border-amber-200">
              <p className="font-medium text-amber-700">Missing Environment Variables</p>
              <p className="mt-1">
                Please make sure you have set up the following environment variables in your project:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
              <p className="mt-2">
                You can set these up by adding them to your .env.local file or in your deployment environment.
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={checkTable} disabled={isChecking || isCreating || !isSupabaseConfigured} variant="outline">
          {isChecking ? "Checking..." : "Check Database"}
        </Button>
        <Button
          onClick={createTable}
          disabled={isCreating || isChecking || (status !== "missing" && status !== "error") || !isSupabaseConfigured}
          className="bg-tetris-turquoise hover:bg-tetris-darkTurquoise"
        >
          {isCreating ? "Creating..." : "Create Tables"}
        </Button>
      </CardFooter>
    </Card>
  )
}
