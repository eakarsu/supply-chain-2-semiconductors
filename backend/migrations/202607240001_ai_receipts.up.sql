CREATE TABLE sc_ai_provider_receipts (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider VARCHAR(32) NOT NULL CHECK (provider = 'openrouter'),
  provider_request_id VARCHAR(160) NOT NULL,
  model VARCHAR(160) NOT NULL,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_request_id)
);
CREATE INDEX sc_ai_provider_receipts_user_created_idx ON sc_ai_provider_receipts(user_id, created_at DESC);
