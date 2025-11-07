-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name VARCHAR(255) NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the leaderboard (public access)
CREATE POLICY "Allow public read access to leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

-- Allow anyone to insert scores (public write access for game scores)
CREATE POLICY "Allow public insert access to leaderboard"
  ON leaderboard FOR INSERT
  WITH CHECK (true);

-- Create an index on score for faster sorting
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
