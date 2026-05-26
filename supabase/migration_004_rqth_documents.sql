-- Migration 004 : Documents RQTH

CREATE TABLE IF NOT EXISTS rqth_documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rqth_employee_id    uuid NOT NULL REFERENCES rqth_employees(id) ON DELETE CASCADE,
  organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nom_fichier         text NOT NULL,
  type_document       text NOT NULL DEFAULT 'autre'
                      CHECK (type_document IN ('rqth', 'facture', 'maintien_emploi', 'autre')),
  storage_path        text NOT NULL,
  taille              integer,
  uploaded_by         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rqth_documents_employee ON rqth_documents (rqth_employee_id);
CREATE INDEX IF NOT EXISTS idx_rqth_documents_org ON rqth_documents (organization_id);

ALTER TABLE rqth_documents ENABLE ROW LEVEL SECURITY;

-- Membres de l'organisation peuvent lire
CREATE POLICY "org members can read rqth documents"
  ON rqth_documents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins et chargés de site peuvent insérer
CREATE POLICY "org editors can insert rqth documents"
  ON rqth_documents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'charge_site')
    )
  );

-- Admins et chargés de site peuvent supprimer
CREATE POLICY "org editors can delete rqth documents"
  ON rqth_documents FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'charge_site')
    )
  );

-- -----------------------------------------------
-- Storage bucket rqth-documents
-- (à créer manuellement dans le dashboard Supabase
--  Storage > New bucket > "rqth-documents" > Private)
-- Policies Storage (à appliquer via dashboard) :
--   SELECT : authenticated users de la même org
--   INSERT : authenticated users de la même org (role admin/charge_site)
--   DELETE : authenticated users de la même org (role admin/charge_site)
-- -----------------------------------------------
