-- Éligibilité CNSS/ITS par employé (coché par défaut = comportement actuel inchangé)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnss_eligible BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS its_eligible  BOOLEAN NOT NULL DEFAULT true;

-- Paramètres de paie par entreprise (VPS + barème ITS, éditables sans redéploiement)
CREATE TABLE IF NOT EXISTS company_payroll_settings (
    company_id      INTEGER PRIMARY KEY,
    vps_rate        NUMERIC(4,2) NOT NULL DEFAULT 4.00 CHECK (vps_rate IN (2.00, 3.00, 4.00)),
    its_brackets    JSONB NOT NULL DEFAULT '[
        {"min":0,      "max":60000,   "rate":0},
        {"min":60001,  "max":150000,  "rate":10},
        {"min":150001, "max":250000,  "rate":15},
        {"min":250001, "max":500000,  "rate":19},
        {"min":500001, "max":1000000, "rate":30},
        {"min":1000001,"max":null,    "rate":40}
    ]'::jsonb,
    cnss_salarie_rate  NUMERIC(4,2) NOT NULL DEFAULT 3.60,
    cnss_patronal_rate NUMERIC(4,2) NOT NULL DEFAULT 15.40,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Ligne par défaut (company_id=0, fallback pour toutes les entreprises sans réglage propre)
INSERT INTO company_payroll_settings (company_id, vps_rate)
VALUES (0, 4.00)
ON CONFLICT (company_id) DO NOTHING;
