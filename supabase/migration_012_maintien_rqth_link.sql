-- Migration 012 : Lier maintien_emploi à rqth_employees
-- Ajoute une clé étrangère optionnelle pour accéder aux situations
-- depuis le profil d'un salarié RQTH

ALTER TABLE maintien_emploi
  ADD COLUMN IF NOT EXISTS rqth_employee_id uuid
  REFERENCES rqth_employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_maintien_rqth_id
  ON maintien_emploi (rqth_employee_id);
