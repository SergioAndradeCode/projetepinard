-- Ajouter effectif_brut et effectif_ecap à oeth_settings
ALTER TABLE oeth_settings ADD COLUMN IF NOT EXISTS effectif_brut integer NOT NULL DEFAULT 0;
ALTER TABLE oeth_settings ADD COLUMN IF NOT EXISTS effectif_ecap integer NOT NULL DEFAULT 0;
UPDATE oeth_settings SET effectif_brut = effectif_assujettissement WHERE effectif_brut = 0 AND effectif_assujettissement > 0;

-- Ajouter effectif_brut et effectif_ecap à establishments
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS effectif_brut integer NOT NULL DEFAULT 0;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS effectif_ecap integer NOT NULL DEFAULT 0;
UPDATE establishments SET effectif_brut = effectif_assujettissement WHERE effectif_brut = 0 AND effectif_assujettissement > 0;
