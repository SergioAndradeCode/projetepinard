-- Migration 018 : date de fin de contrat pour les contrats à durée limitée
-- Applicable aux CDD, CTT (intérimaires), stages, alternances
ALTER TABLE rqth_employees
  ADD COLUMN IF NOT EXISTS date_fin_contrat date;

CREATE INDEX IF NOT EXISTS idx_rqth_date_fin_contrat ON rqth_employees (date_fin_contrat);

COMMENT ON COLUMN rqth_employees.date_fin_contrat IS
  'Date de fin prévisionnelle du contrat (CDD, stage, alternance). Null pour CDI.';
