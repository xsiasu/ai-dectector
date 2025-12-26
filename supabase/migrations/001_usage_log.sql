-- Usage Log Table for Server-Side Usage Tracking
-- Run this SQL in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  usage_count INT DEFAULT 0,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'trial', 'paid')),
  paid_credits INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast IP hash lookups
CREATE INDEX IF NOT EXISTS idx_usage_ip_hash ON usage_log(ip_hash);

-- Index for cleanup queries (optional)
CREATE INDEX IF NOT EXISTS idx_usage_updated ON usage_log(updated_at);

-- Enable Row Level Security
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (API access)
CREATE POLICY "Allow all for anon" ON usage_log
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_usage_log_updated_at
  BEFORE UPDATE ON usage_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
