-- Migration: add snapshot metadata to fiscal_year_closings
BEGIN;

ALTER TABLE fiscal_year_closings
  ADD COLUMN IF NOT EXISTS snapshot_count   INTEGER;

ALTER TABLE fiscal_year_closings
  ADD COLUMN IF NOT EXISTS snapshot_at      TIMESTAMP WITH TIME ZONE;

ALTER TABLE fiscal_year_closings
  ADD COLUMN IF NOT EXISTS snapshot_success BOOLEAN;

ALTER TABLE fiscal_year_closings
  ADD COLUMN IF NOT EXISTS snapshot_error   TEXT;

COMMIT;

-- Note: ces colonnes sont nullables pour la compatibilité; après migration,
-- vous pouvez backfiller depuis `fiscal_year_balances` si nécessaire.
