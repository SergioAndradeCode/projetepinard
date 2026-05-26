-- Migration 011 : Module Gestion du Maintien dans l'emploi
-- Suivi des situations de maintien (AT/MP, maladie longue durée, inaptitude)
-- et des aménagements mis en place pour les salariés BOETH

CREATE TABLE IF NOT EXISTS maintien_emploi (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  establishment_id        uuid REFERENCES establishments(id),

  -- Identité du salarié
  prenom                  text NOT NULL,
  nom                     text NOT NULL,
  poste                   text,
  code_interne            text,

  -- Nature de la situation
  type_situation          text NOT NULL CHECK (type_situation IN (
                            'at_mp', 'maladie_longue', 'inaptitude_partielle',
                            'inaptitude_totale', 'autre'
                          )),
  date_debut_situation    date NOT NULL,
  date_retour_prevue      date,

  -- Suivi
  statut                  text NOT NULL DEFAULT 'en_cours' CHECK (statut IN (
                            'en_cours', 'amenage', 'reclasse', 'resolu', 'rupture'
                          )),

  -- Aménagements
  amenagements            text[],           -- tableau de codes : 'teletravail', 'horaires', etc.
  detail_amenagements     text,

  -- Interlocuteurs sollicités
  medecin_travail_saisi   boolean NOT NULL DEFAULT false,
  sameth_saisi            boolean NOT NULL DEFAULT false,
  cap_emploi_saisi        boolean NOT NULL DEFAULT false,

  -- Notes libres
  notes                   text,

  -- Audit
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_maintien_org      ON maintien_emploi (organization_id);
CREATE INDEX IF NOT EXISTS idx_maintien_statut   ON maintien_emploi (statut);

-- RLS
ALTER TABLE maintien_emploi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_maintien"
  ON maintien_emploi FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "charge_manage_maintien"
  ON maintien_emploi FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'charge_site', 'charge_mission')
    )
  );

-- Trigger updated_at
CREATE OR REPLACE TRIGGER set_updated_at_maintien
  BEFORE UPDATE ON maintien_emploi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
