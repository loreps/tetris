import { createClient } from "@supabase/supabase-js"

// Make sure we're using the correct environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Check if the required environment variables are available
const hasSupabaseConfig = !!supabaseUrl && !!supabaseAnonKey

// Create a dummy client for type checking when environment variables are missing
const dummyClient = {
  from: () => ({
    select: () => ({ data: null, error: new Error("Supabase not configured") }),
    insert: () => ({ data: null, error: new Error("Supabase not configured") }),
    update: () => ({ data: null, error: new Error("Supabase not configured") }),
    delete: () => ({ data: null, error: new Error("Supabase not configured") }),
    eq: () => ({ data: null, error: new Error("Supabase not configured") }),
    order: () => ({ data: null, error: new Error("Supabase not configured") }),
    limit: () => ({ data: null, error: new Error("Supabase not configured") }),
    single: () => ({ data: null, error: new Error("Supabase not configured") }),
    gt: () => ({ data: null, error: new Error("Supabase not configured") }),
    lt: () => ({ data: null, error: new Error("Supabase not configured") }),
  }),
  rpc: () => ({ data: null, error: new Error("Supabase not configured") }),
  query: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
}

// Create the Supabase client only if environment variables are available
export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : (dummyClient as any)

// Export a flag to check if Supabase is configured
export const isSupabaseConfigured = hasSupabaseConfig

// Database types
export type Player = {
  id: string
  nickname?: string
  name?: string
  room_id?: string // Added room_id field to match the actual schema
  created_at: string
  updated_at: string
}

export type Room = {
  id: string
  name: string
  game_time: number
  difficulty: number
  special_block_frequency: number
  created_at: string
  expires_at: string
}

export type RoomLeaderboard = {
  id: number
  room_id: string
  player_id: string
  score: number
  created_at: string
  updated_at: string
  // Join fields
  player?: Player
}

// Helper functions for players
export async function createOrGetPlayer(playerId: string, nickname: string, roomId: string) {
  if (!isSupabaseConfigured) {
    console.error("Supabase environment variables are not set. Cannot create/get player.")
    return null
  }

  try {
    // First, check if the rooms table exists by trying to get the room
    const { data: roomData, error: roomError } = await supabase.from("rooms").select("id").eq("id", roomId).single()

    // If the room doesn't exist, create it with default values
    if (roomError && roomError.code === "42P01") {
      console.error("Rooms table doesn't exist. Please set up the database first.")
      return null
    } else if (roomError && roomError.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is expected if the room doesn't exist in the table
      console.error("Error checking room:", roomError)
      return null
    }

    // If the room doesn't exist in the database but the table exists, create a temporary room
    if (!roomData && roomError && roomError.code === "PGRST116") {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 300 * 1000) // 5 minutes default

      const { error: createRoomError } = await supabase.from("rooms").insert([
        {
          id: roomId,
          name: `Room ${roomId}`,
          game_time: 300, // 5 minutes default
          difficulty: 5, // Medium difficulty
          special_block_frequency: 15, // Default special block frequency
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        },
      ])

      if (createRoomError) {
        console.error("Error creating temporary room:", createRoomError)
        return null
      }
    }

    // Now check if player exists
    const { data: existingPlayer, error: fetchError } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .single()

    if (fetchError && fetchError.code === "42P01") {
      console.error("Players table doesn't exist. Please set up the database first.")
      return null
    } else if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is expected if the player doesn't exist
      console.error("Error fetching player:", fetchError)
      return null
    }

    if (existingPlayer) {
      // Check if the table has nickname or name column
      const hasNickname = "nickname" in existingPlayer
      const nameColumn = hasNickname ? "nickname" : "name"

      // Update nickname if it changed
      if (existingPlayer[nameColumn] !== nickname) {
        const updateData = {}
        updateData[nameColumn] = nickname

        const { error: updateError } = await supabase.from("players").update(updateData).eq("id", playerId)

        if (updateError) {
          console.error("Error updating player nickname:", updateError)
        }
      }
      return existingPlayer
    } else {
      // Try to determine which column to use (nickname or name)
      // First try with nickname and include room_id
      let insertData = { id: playerId, nickname: nickname, room_id: roomId }
      let { data: newPlayer, error: insertError } = await supabase
        .from("players")
        .insert([insertData])
        .select()
        .single()

      // If that fails, try with name
      if (insertError) {
        console.error("Error creating player with nickname:", insertError)

        insertData = { id: playerId, name: nickname, room_id: roomId }
        const result = await supabase.from("players").insert([insertData]).select().single()

        newPlayer = result.data
        insertError = result.error
      }

      if (insertError) {
        console.error("Error creating player:", insertError)
        return null
      }

      return newPlayer
    }
  } catch (error) {
    console.error("Error in createOrGetPlayer:", error)
    return null
  }
}

// Helper functions for rooms
export async function createRoom(roomData: Omit<Room, "created_at" | "expires_at">) {
  if (!isSupabaseConfigured) {
    console.error("Supabase environment variables are not set. Cannot create room.")
    return null
  }

  try {
    // First check if the rooms table exists
    const { data: tableCheck, error: tableError } = await supabase.from("rooms").select("count").limit(1)

    if (tableError && tableError.code === "42P01") {
      console.error("Rooms table doesn't exist. Please set up the database first.")
      return null
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + roomData.game_time * 1000)

    const { data, error } = await supabase
      .from("rooms")
      .insert([
        {
          ...roomData,
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating room:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in createRoom:", error)
    return null
  }
}

export async function getRoom(roomId: string) {
  if (!isSupabaseConfigured) {
    console.error("Supabase environment variables are not set. Cannot fetch room.")
    return null
  }

  try {
    const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).single()

    if (error && error.code === "42P01") {
      console.error("Rooms table doesn't exist. Please set up the database first.")
      return null
    } else if (error) {
      console.error("Error fetching room:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getRoom:", error)
    return null
  }
}

export async function getActiveRooms() {
  if (!isSupabaseConfigured) {
    console.error("Supabase environment variables are not set. Cannot fetch active rooms.")
    return []
  }

  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })

    if (error && error.code === "42P01") {
      console.error("Rooms table doesn't exist. Please set up the database first.")
      return []
    } else if (error) {
      console.error("Error fetching active rooms:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getActiveRooms:", error)
    return []
  }
}

// Helper functions for room leaderboard
export async function createOrUpdateLeaderboardEntry(roomId: string, playerId: string, score = 0) {
  if (!isSupabaseConfigured) {
    console.error("Supabase environment variables are not set. Cannot create/update leaderboard entry.")
    return null
  }

  try {
    // First check if the leaderboard table exists
    const { data: tableCheck, error: tableError } = await supabase.from("room_leaderboard").select("count").limit(1)

    if (tableError && tableError.code === "42P01") {
      console.error("Room leaderboard table doesn't exist. Please set up the database first.")
      return null
    }

    // Check if entry exists
    const { data: existingEntry, error: fetchError } = await supabase
      .from("room_leaderboard")
      .select("*")
      .eq("room_id", roomId)
      .eq("player_id", playerId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching leaderboard entry:", fetchError)
      return null
    }

    if (existingEntry) {
      // Only update if the new score is higher
      if (score > existingEntry.score) {
        const { data: updatedEntry, error: updateError } = await supabase
          .from("room_leaderboard")
          .update({ score })
          .eq("id", existingEntry.id)
          .select()
          .single()

        if (updateError) {
          console.error("Error updating leaderboard entry:", updateError)
          return null
        }

        return updatedEntry
      }
      return existingEntry
    } else {
      // Create new entry
      const { data: newEntry, error: insertError } = await supabase
        .from("room_leaderboard")
        .insert([{ room_id: roomId, player_id: playerId, score }])
        .select()
        .single()

      if (insertError) {
        console.error("Error creating leaderboard entry:", insertError)
        return null
      }

      return newEntry
    }
  } catch (error) {
    console.error("Error in createOrUpdateLeaderboardEntry:", error)
    return null
  }
}

export async function getRoomLeaderboard(roomId: string) {
  if (!isSupabaseConfigured) {
    console.error("Supabase environment variables are not set. Cannot fetch room leaderboard.")
    return []
  }

  try {
    // Check if the leaderboard table exists
    const { data: tableCheck, error: tableError } = await supabase.from("room_leaderboard").select("count").limit(1)

    if (tableError && tableError.code === "42P01") {
      console.error("Room leaderboard table doesn't exist. Please set up the database first.")
      return []
    }

    // Get leaderboard entries
    const { data, error } = await supabase
      .from("room_leaderboard")
      .select(`
        id,
        room_id,
        player_id,
        score
      `)
      .eq("room_id", roomId)
      .order("score", { ascending: false })

    if (error) {
      console.error("Error fetching room leaderboard:", error)
      return []
    }

    // Fetch player information separately
    const enhancedData = await Promise.all(
      data.map(async (entry) => {
        try {
          // Get player info
          const { data: playerData } = await supabase.from("players").select("*").eq("id", entry.player_id).single()

          // Determine player name from either nickname or name column
          const playerName = playerData?.nickname || playerData?.name || "Unknown Player"

          return {
            ...entry,
            player: playerData
              ? {
                  ...playerData,
                  nickname: playerName,
                }
              : { id: entry.player_id, nickname: "Unknown Player" },
          }
        } catch (error) {
          // If there's an error fetching player data, return a default player
          return {
            ...entry,
            player: { id: entry.player_id, nickname: "Unknown Player" },
          }
        }
      }),
    )

    return enhancedData
  } catch (error) {
    console.error("Error in getRoomLeaderboard:", error)
    return []
  }
}

export async function getGlobalLeaderboard(limit = 10) {
  if (!isSupabaseConfigured) {
    console.error("Supabase environment variables are not set. Cannot fetch global leaderboard.")
    return []
  }

  try {
    // Check if the leaderboard table exists
    const { data: tableCheck, error: tableError } = await supabase.from("room_leaderboard").select("count").limit(1)

    if (tableError && tableError.code === "42P01") {
      console.error("Room leaderboard table doesn't exist. Please set up the database first.")
      return []
    }

    // Use a simpler approach without RPC
    // Get top scores from leaderboard
    const { data, error } = await supabase
      .from("room_leaderboard")
      .select(`
        id, 
        room_id, 
        player_id, 
        score
      `)
      .order("score", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching global leaderboard:", error)
      return []
    }

    // Fetch player and room information separately
    const enhancedData = await Promise.all(
      data.map(async (entry) => {
        try {
          // Get player info
          const { data: playerData } = await supabase.from("players").select("*").eq("id", entry.player_id).single()

          // Get room info
          const { data: roomData } = await supabase.from("rooms").select("*").eq("id", entry.room_id).single()

          // Determine player name from either nickname or name column
          const playerName = playerData?.nickname || playerData?.name || "Unknown Player"

          return {
            ...entry,
            player: playerData
              ? {
                  ...playerData,
                  nickname: playerName,
                }
              : { id: entry.player_id, nickname: "Unknown Player" },
            room: roomData || { id: entry.room_id, name: "Unknown Room" },
          }
        } catch (error) {
          // If there's an error fetching related data, return with defaults
          return {
            ...entry,
            player: { id: entry.player_id, nickname: "Unknown Player" },
            room: { id: entry.room_id, name: "Unknown Room" },
          }
        }
      }),
    )

    return enhancedData
  } catch (error) {
    console.error("Error in getGlobalLeaderboard:", error)
    return []
  }
}

export async function getRoomPlayerCount(roomId: string) {
  if (!isSupabaseConfigured) {
    console.error("Supabase environment variables are not set. Cannot fetch room player count.")
    return 0
  }

  try {
    // Check if the leaderboard table exists
    const { data: tableCheck, error: tableError } = await supabase.from("room_leaderboard").select("count").limit(1)

    if (tableError && tableError.code === "42P01") {
      console.error("Room leaderboard table doesn't exist. Please set up the database first.")
      return 0
    }

    const { count, error } = await supabase
      .from("room_leaderboard")
      .select("id", { count: "exact" })
      .eq("room_id", roomId)

    if (error) {
      console.error("Error fetching room player count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error in getRoomPlayerCount:", error)
    return 0
  }
}

export async function cleanupOldData(hours = 24) {
  if (!isSupabaseConfigured) {
    console.error("Supabase environment variables are not set. Cannot clean up old data.")
    return
  }

  try {
    // Call the cleanup function for expired rooms
    await supabase.rpc("cleanup_expired_rooms")
  } catch (error) {
    console.error("Error in cleanupOldData:", error)
  }
}
