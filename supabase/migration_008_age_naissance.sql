-- Ajouter la date de naissance sur les salariés RQTH
-- Permet de calculer le coefficient senior (×1.5 UB) pour les BOETH de 50 ans et plus
ALTER TABLE rqth_employees ADD COLUMN IF NOT EXISTS date_naissance date;
