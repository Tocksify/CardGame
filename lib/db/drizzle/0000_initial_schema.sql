-- Initial schema migration
-- Creates the users and match_history tables for Aethermancer

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  arcane_shards INTEGER NOT NULL DEFAULT 0,
  rarity_boost INTEGER NOT NULL DEFAULT 0,
  unlocked_achievement_ids TEXT NOT NULL DEFAULT '[]',
  purchased_challenger_ids TEXT NOT NULL DEFAULT '[]',
  gifted_challenger_ids TEXT NOT NULL DEFAULT '[]',
  achievement_progress TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  result TEXT NOT NULL,
  opponent_name TEXT NOT NULL,
  game_mode TEXT NOT NULL,
  shards_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
