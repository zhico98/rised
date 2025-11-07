-- Create rewards table to track collected rewards per wallet
CREATE TABLE IF NOT EXISTS rewards (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  rewards_collected INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address)
);

-- Enable Row Level Security
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read rewards
CREATE POLICY "Allow public read access to rewards"
  ON rewards
  FOR SELECT
  TO public
  USING (true);

-- Allow anyone to insert/update rewards
CREATE POLICY "Allow public insert access to rewards"
  ON rewards
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to rewards"
  ON rewards
  FOR UPDATE
  TO public
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rewards_wallet ON rewards(wallet_address);
