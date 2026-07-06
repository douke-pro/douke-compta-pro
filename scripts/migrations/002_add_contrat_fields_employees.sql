-- Champs optionnels pour Article 2 (période d'essai) et Article 3 (missions)
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS periode_essai TEXT,
    ADD COLUMN IF NOT EXISTS missions JSONB DEFAULT '[]';
