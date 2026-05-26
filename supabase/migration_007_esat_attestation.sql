-- Ajouter le champ montant_attestation sur les achats ESAT/EA
-- Optionnel : permet à l'entreprise de saisir le montant exact figurant sur l'attestation
-- annuelle remise par l'EA/ESAT (distinct de l'estimation Talenth à 30% du HT).
ALTER TABLE esat_purchases ADD COLUMN IF NOT EXISTS montant_attestation numeric(12,2);
