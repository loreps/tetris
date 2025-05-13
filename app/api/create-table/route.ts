import { type NextRequest, NextResponse } from "next/server"
import { supabase, isSupabaseConfigured } from "@/utils/supabase"

export async function POST(request: NextRequest) {
  // Check if Supabase environment variables are set
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      {
        error:
          "Supabase environment variables are missing. Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
      },
      { status: 500 },
    )
  }

  try {
    // Create tables one by one in the correct order

    // 1. First create the rooms table
    try {
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS rooms (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          game_time INTEGER NOT NULL,
          difficulty INTEGER NOT NULL,
          special_block_frequency INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
      `)
      console.log("Rooms table created or already exists")
    } catch (error) {
      console.error("Error creating rooms table:", error)
      // Continue with other tables even if this one fails
    }

    // 2. Then create the players table (which references rooms)
    try {
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS players (
          id TEXT PRIMARY KEY,
          nickname TEXT NOT NULL,
          room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log("Players table created or already exists")
    } catch (error) {
      console.error("Error creating players table:", error)
    }

    // 3. Finally create the room_leaderboard table (which references both rooms and players)
    try {
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS room_leaderboard (
          id SERIAL PRIMARY KEY,
          room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
          player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
          score INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(room_id, player_id)
        )
      `)
      console.log("Room leaderboard table created or already exists")
    } catch (error) {
      console.error("Error creating room_leaderboard table:", error)
    }

    // 4. Create indexes for better performance
    try {
      await supabase.query(`
        CREATE INDEX IF NOT EXISTS idx_room_leaderboard_room_id ON room_leaderboard(room_id);
        CREATE INDEX IF NOT EXISTS idx_room_leaderboard_player_id ON room_leaderboard(player_id);
        CREATE INDEX IF NOT EXISTS idx_room_leaderboard_score ON room_leaderboard(score DESC);
        CREATE INDEX IF NOT EXISTS idx_rooms_expires_at ON rooms(expires_at);
        CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);
      `)
      console.log("Indexes created or already exist")
    } catch (error) {
      console.error("Error creating indexes:", error)
    }

    // 5. Create function to update timestamps
    try {
      await supabase.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `)
      console.log("Updated_at function created or replaced")
    } catch (error) {
      console.error("Error creating updated_at function:", error)
    }

    // 6. Create triggers
    try {
      await supabase.query(`
        DROP TRIGGER IF EXISTS update_players_updated_at ON players;
        CREATE TRIGGER update_players_updated_at
        BEFORE UPDATE ON players
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_room_leaderboard_updated_at ON room_leaderboard;
        CREATE TRIGGER update_room_leaderboard_updated_at
        BEFORE UPDATE ON room_leaderboard
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `)
      console.log("Triggers created or replaced")
    } catch (error) {
      console.error("Error creating triggers:", error)
    }

    // 7. Create RLS policies
    try {
      await supabase.query(`
        -- Enable RLS on tables
        ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
        ALTER TABLE players ENABLE ROW LEVEL SECURITY;
        ALTER TABLE room_leaderboard ENABLE ROW LEVEL SECURITY;

        -- Create policies for rooms table
        DROP POLICY IF EXISTS "Allow public read access for rooms" ON rooms;
        CREATE POLICY "Allow public read access for rooms"
          ON rooms
          FOR SELECT
          USING (true);

        DROP POLICY IF EXISTS "Allow insert for all users for rooms" ON rooms;
        CREATE POLICY "Allow insert for all users for rooms"
          ON rooms
          FOR INSERT
          WITH CHECK (true);

        DROP POLICY IF EXISTS "Allow update for all users for rooms" ON rooms;
        CREATE POLICY "Allow update for all users for rooms"
          ON rooms
          FOR UPDATE
          USING (true);

        -- Create policies for players table
        DROP POLICY IF EXISTS "Allow public read access for players" ON players;
        CREATE POLICY "Allow public read access for players"
          ON players
          FOR SELECT
          USING (true);

        DROP POLICY IF EXISTS "Allow insert for all users for players" ON players;
        CREATE POLICY "Allow insert for all users for players"
          ON players
          FOR INSERT
          WITH CHECK (true);

        DROP POLICY IF EXISTS "Allow update for all users for players" ON players;
        CREATE POLICY "Allow update for all users for players"
          ON players
          FOR UPDATE
          USING (true);

        -- Create policies for room_leaderboard table
        DROP POLICY IF EXISTS "Allow public read access for room_leaderboard" ON room_leaderboard;
        CREATE POLICY "Allow public read access for room_leaderboard"
          ON room_leaderboard
          FOR SELECT
          USING (true);

        DROP POLICY IF EXISTS "Allow insert for all users for room_leaderboard" ON room_leaderboard;
        CREATE POLICY "Allow insert for all users for room_leaderboard"
          ON room_leaderboard
          FOR INSERT
          WITH CHECK (true);

        DROP POLICY IF EXISTS "Allow update for all users for room_leaderboard" ON room_leaderboard;
        CREATE POLICY "Allow update for all users for room_leaderboard"
          ON room_leaderboard
          FOR UPDATE
          USING (true);
      `)
      console.log("RLS policies created or replaced")
    } catch (error) {
      console.error("Error creating RLS policies:", error)
    }

    // 8. Create cleanup function
    try {
      await supabase.query(`
        CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
        RETURNS void AS $$
        BEGIN
          DELETE FROM rooms WHERE expires_at < CURRENT_TIMESTAMP;
        END;
        $$ LANGUAGE plpgsql;
      `)
      console.log("Cleanup function created or replaced")
    } catch (error) {
      console.error("Error creating cleanup function:", error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// Add a GET handler to provide information when accessed directly
export async function GET() {
  return NextResponse.json(
    {
      message: "This is an API endpoint for creating database tables. Use POST method to create tables.",
      usage: "Send a POST request to this endpoint to create the necessary database tables.",
      redirect: "/admin/database-setup",
    },
    { status: 200 },
  )
}
