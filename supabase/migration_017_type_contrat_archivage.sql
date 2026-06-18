-- Migration 017 : Type de contrat et archivage des collaborateurs RQTH
-- Permet de distinguer CDI / CDD / alternants / stagiaires / intérimaires
-- et d'archiver un départ sans perdre l'historique de calcul DOETH.

ALTER TABLE rqth_employees
  ADD COLUMN IF NOT EXISTS type_contrat text NOT NULL DEFAULT 'cdi'
    CHECK (type_contrat IN ('cdi', 'cdd', 'alternant', 'stagiaire', 'interimaire', 'autre')),
  ADD COLUMN IF NOT EXISTS date_sortie_entreprise date;

COMMENT ON COLUMN rqth_employees.type_contrat IS
  'Nature du contrat : cdi, cdd, alternant, stagiaire, interimaire, autre. '
  'Stagiaires et intérimaires sont exclus des calculs UB OETH.';

COMMENT ON COLUMN rqth_employees.date_sortie_entreprise IS
  'Date effective de départ de la structure (fin contrat, démission, rupture...). '
  'Distincte de date_fin RQTH. Quand renseignée, borne la proratisation DOETH '
  'à MIN(date_fin_rqth, date_sortie_entreprise).';

CREATE INDEX IF NOT EXISTS idx_rqth_sortie ON rqth_employees (date_sortie_entreprise);
CREATE INDEX IF NOT EXISTS idx_rqth_contrat ON rqth_employees (type_contrat);
