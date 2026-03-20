-- TwilightSnap Database Schema v1.0 — Run this in Supabase SQL Editor

-- ============================================================
-- ENUMS (idempotent)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('purchase', 'usage', 'refund', 'bonus');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE conversion_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_purchased INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  result_url TEXT,
  original_filename TEXT NOT NULL,
  status conversion_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  model_used TEXT NOT NULL DEFAULT 'gpt-image-1',
  api_cost NUMERIC,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd NUMERIC,
  latency_ms INTEGER,
  status_code INTEGER NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ts_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_ts_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ts_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ts_conversions_user_id ON conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_ts_conversions_created_at ON conversions(created_at);
CREATE INDEX IF NOT EXISTS idx_ts_conversions_status ON conversions(status);
CREATE INDEX IF NOT EXISTS idx_ts_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ts_api_logs_created_at ON api_logs(created_at);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_credits_updated_at ON credits;
CREATE TRIGGER set_credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE + CREDITS ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL)
  );

  INSERT INTO credits (user_id, balance, lifetime_purchased)
  VALUES (NEW.id, 0, 0);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- profiles: users read/update own, admins read all
DROP POLICY IF EXISTS ts_users_read_own_profile ON profiles;
CREATE POLICY ts_users_read_own_profile
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS ts_admins_read_all_profiles ON profiles;
CREATE POLICY ts_admins_read_all_profiles
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS ts_users_update_own_profile ON profiles;
CREATE POLICY ts_users_update_own_profile
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- credits: users read own
DROP POLICY IF EXISTS ts_users_read_own_credits ON credits;
CREATE POLICY ts_users_read_own_credits
  ON credits FOR SELECT
  USING (auth.uid() = user_id);

-- transactions: users read own
DROP POLICY IF EXISTS ts_users_read_own_transactions ON transactions;
CREATE POLICY ts_users_read_own_transactions
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- conversions: users read/insert own
DROP POLICY IF EXISTS ts_users_read_own_conversions ON conversions;
CREATE POLICY ts_users_read_own_conversions
  ON conversions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS ts_users_insert_own_conversions ON conversions;
CREATE POLICY ts_users_insert_own_conversions
  ON conversions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- api_logs: admins only read
DROP POLICY IF EXISTS ts_admins_read_api_logs ON api_logs;
CREATE POLICY ts_admins_read_api_logs
  ON api_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
