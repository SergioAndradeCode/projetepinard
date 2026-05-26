-- Migration 013 : Table des membres en attente d'inscription
-- Remplace le système d'invitation par email (lien magique) :
-- l'admin pré-enregistre un email + rôle + site, puis le collaborateur
-- crée lui-même son compte sur /join

CREATE TABLE IF NOT EXISTS pending_members (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id  uuid        NOT NULL REFERENCES organizations(id)   ON DELETE CASCADE,
  email            text        NOT NULL,
  role             text        NOT NULL DEFAULT 'lecteur',
  establishment_id uuid        REFERENCES establishments(id)           ON DELETE SET NULL,
  created_by       uuid        REFERENCES profiles(id)                 ON DELETE SET NULL,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (email)   -- un email ne peut être en attente que pour une seule org
);

-- Index pour la vérification rapide à l'inscription
CREATE INDEX IF NOT EXISTS idx_pending_members_email
  ON pending_members (lower(email));

-- ── RLS ────────────────────────────────────────────────────────────────────────
ALTER TABLE pending_members ENABLE ROW LEVEL SECURITY;

-- Les membres de l'organisation voient les accès en attente de leur org
CREATE POLICY "pending_members_select"
  ON pending_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = pending_members.organization_id
    )
  );

-- Admin et référent handicap peuvent ajouter des accès en attente
CREATE POLICY "pending_members_insert"
  ON pending_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = pending_members.organization_id
        AND profiles.role IN ('admin', 'charge_site')
    )
  );

-- Admin et référent handicap peuvent supprimer (annuler un accès)
CREATE POLICY "pending_members_delete"
  ON pending_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = pending_members.organization_id
        AND profiles.role IN ('admin', 'charge_site')
    )
  );
