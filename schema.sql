-- Create the players table
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  game_time INTEGER NOT NULL,
  difficulty INTEGER NOT NULL,
  special_block_frequency INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create the room_leaderboard table (join table between rooms and players)
CREATE TABLE IF NOT EXISTS room_leaderboard (
  id SERIAL PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, player_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_room_leaderboard_room_id ON room_leaderboard(room_id);
CREATE INDEX IF NOT EXISTS idx_room_leaderboard_player_id ON room_leaderboard(player_id);
CREATE INDEX IF NOT EXISTS idx_room_leaderboard_score ON room_leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_expires_at ON rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
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

-- Create policies for players table
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

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

-- Create policies for rooms table
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

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

-- Create policies for room_leaderboard table
ALTER TABLE room_leaderboard ENABLE ROW LEVEL SECURITY;

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

-- Create a function to clean up expired rooms
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
