-- StarkBuy Phase 3: customer experience persistence
-- Run once after phase2_database_completeness_migration.sql.

BEGIN;

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  active        BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT newsletter_email_normalized CHECK (email = LOWER(BTRIM(email))),
  CONSTRAINT newsletter_email_length CHECK (char_length(email) BETWEEN 5 AND 254)
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

COMMIT;
