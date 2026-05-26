-- =============================================================
-- MIGRATIONS V2 TALENTH — À exécuter dans Supabase SQL Editor
-- Copier-coller l'intégralité dans SQL Editor > Run
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. TABLE establishments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS establishments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                      TEXT NOT NULL,
  siret                     TEXT,
  address                   TEXT,
  is_headquarters           BOOLEAN NOT NULL DEFAULT FALSE,
  effectif_assujettissement INT NOT NULL DEFAULT 0,
  smic_horaire_ref          NUMERIC(6,2) NOT NULL DEFAULT 11.88,
  coefficient_contribution  INT NOT NULL DEFAULT 400,
  annee                     INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_read_establishments" ON establishments;
CREATE POLICY "org_members_read_establishments"
  ON establishments FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "admin_write_establishments" ON establishments;
CREATE POLICY "admin_write_establishments"
  ON establishments FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- ─────────────────────────────────────────────────────────────
-- 2. TABLE budget_allocations
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_allocations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
  annee            INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INT,
  montant_total    NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index unique qui gère correctement les NULLs
-- (PostgreSQL ne force pas l'unicité sur NULL dans une UNIQUE constraint standard)
CREATE UNIQUE INDEX IF NOT EXISTS budget_alloc_site_uniq
  ON budget_allocations (organization_id, establishment_id, annee)
  WHERE establishment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS budget_alloc_global_uniq
  ON budget_allocations (organization_id, annee)
  WHERE establishment_id IS NULL;

ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_read_budget_alloc" ON budget_allocations;
CREATE POLICY "org_members_read_budget_alloc"
  ON budget_allocations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "admin_charge_write_budget_alloc" ON budget_allocations;
CREATE POLICY "admin_charge_write_budget_alloc"
  ON budget_allocations FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'charge_site')
  ));


-- ─────────────────────────────────────────────────────────────
-- 3. TABLE budget_expenses
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_expenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
  categorie        TEXT NOT NULL CHECK (categorie IN (
    'esat_ea', 'sensibilisation', 'communication',
    'formation', 'prestations_externes', 'autres'
  )),
  montant          NUMERIC(12,2) NOT NULL DEFAULT 0,
  description      TEXT NOT NULL,
  date_depense     DATE NOT NULL,
  facture_ref      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_read_budget_exp" ON budget_expenses;
CREATE POLICY "org_members_read_budget_exp"
  ON budget_expenses FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "admin_charge_write_budget_exp" ON budget_expenses;
CREATE POLICY "admin_charge_write_budget_exp"
  ON budget_expenses FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'charge_site')
  ));


-- ─────────────────────────────────────────────────────────────
-- 4. ALTER TABLE profiles
--    Nouveau rôle charge_site + colonne establishment_id
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'charge_site', 'lecteur'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS establishment_id UUID
  REFERENCES establishments(id) ON DELETE SET NULL;

-- Migrer les anciens comptes 'referent' → 'charge_site'
UPDATE profiles SET role = 'charge_site' WHERE role = 'referent';


-- ─────────────────────────────────────────────────────────────
-- 5. ALTER TABLE rqth_employees — colonnes v2
-- ─────────────────────────────────────────────────────────────
ALTER TABLE rqth_employees
  ADD COLUMN IF NOT EXISTS establishment_id UUID
    REFERENCES establishments(id) ON DELETE SET NULL;

ALTER TABLE rqth_employees ADD COLUMN IF NOT EXISTS nom      TEXT;
ALTER TABLE rqth_employees ADD COLUMN IF NOT EXISTS prenom   TEXT;
ALTER TABLE rqth_employees ADD COLUMN IF NOT EXISTS matricule TEXT;
ALTER TABLE rqth_employees ADD COLUMN IF NOT EXISTS service  TEXT;
ALTER TABLE rqth_employees ADD COLUMN IF NOT EXISTS poste    TEXT;
ALTER TABLE rqth_employees ADD COLUMN IF NOT EXISTS notes    TEXT;

ALTER TABLE rqth_employees
  ADD COLUMN IF NOT EXISTS taux_temps_travail INT NOT NULL DEFAULT 100;

ALTER TABLE rqth_employees ADD COLUMN IF NOT EXISTS batiment TEXT;

-- Migrer full_name → nom + prénom si la colonne existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rqth_employees' AND column_name = 'full_name'
  ) THEN
    UPDATE rqth_employees
    SET
      prenom = SPLIT_PART(TRIM(full_name), ' ', 1),
      nom    = TRIM(SUBSTRING(TRIM(full_name) FROM POSITION(' ' IN TRIM(full_name)) + 1))
    WHERE full_name IS NOT NULL
      AND (nom IS NULL OR nom = '');
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 6. ALTER TABLE esat_purchases — establishment_id
-- ─────────────────────────────────────────────────────────────
ALTER TABLE esat_purchases
  ADD COLUMN IF NOT EXISTS establishment_id UUID
  REFERENCES establishments(id) ON DELETE SET NULL;


-- ─────────────────────────────────────────────────────────────
-- 7. FONCTION + TRIGGER — siège auto à la création d'une org
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_default_establishment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO establishments (
    organization_id, name, is_headquarters,
    effectif_assujettissement, smic_horaire_ref, coefficient_contribution, annee
  )
  SELECT
    NEW.id,
    COALESCE(NEW.name, 'Siège social'),
    TRUE,
    0, 11.88, 400,
    EXTRACT(YEAR FROM NOW())::INT
  WHERE NOT EXISTS (
    SELECT 1 FROM establishments WHERE organization_id = NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_default_establishment ON organizations;
CREATE TRIGGER trg_create_default_establishment
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION create_default_establishment();


-- ─────────────────────────────────────────────────────────────
-- 8. Créer le siège pour les orgs existantes (rétroactif)
-- ─────────────────────────────────────────────────────────────
INSERT INTO establishments (
  organization_id, name, is_headquarters,
  effectif_assujettissement, smic_horaire_ref, coefficient_contribution, annee
)
SELECT
  o.id,
  COALESCE(o.name, 'Siège social'),
  TRUE,
  COALESCE(s.effectif_assujettissement, 0),
  COALESCE(s.smic_horaire_ref, 11.88),
  COALESCE(s.coefficient_contribution, 400),
  COALESCE(s.annee, EXTRACT(YEAR FROM NOW())::INT)
FROM organizations o
LEFT JOIN oeth_settings s
  ON s.organization_id = o.id
  AND s.annee = EXTRACT(YEAR FROM NOW())::INT
WHERE NOT EXISTS (
  SELECT 1 FROM establishments e WHERE e.organization_id = o.id
);


-- ─────────────────────────────────────────────────────────────
-- 9. TABLE calendar_events — événements personnalisés par org
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
  titre            TEXT NOT NULL,
  description      TEXT,
  date_evenement   DATE NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('obligation', 'evenement', 'alerte_rqth')),
  recurrence       TEXT CHECK (recurrence IN ('annuelle', 'mensuelle')),
  est_global       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ajouter establishment_id si la table existait déjà sans cette colonne
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL;

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_read_calendar_events" ON calendar_events;
CREATE POLICY "org_members_read_calendar_events"
  ON calendar_events FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "admin_charge_write_calendar_events" ON calendar_events;
CREATE POLICY "admin_charge_write_calendar_events"
  ON calendar_events FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'charge_site')
  ));


-- ─────────────────────────────────────────────────────────────
-- 10. RLS ISOLATION PAR ÉTABLISSEMENT
--     Les utilisateurs avec establishment_id défini dans leur
--     profil ne voient que les données de leur site.
-- ─────────────────────────────────────────────────────────────

-- Fonction helper : retourne l'establishment_id du user courant (NULL = accès global)
CREATE OR REPLACE FUNCTION auth_user_establishment_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT establishment_id FROM profiles WHERE id = auth.uid()
$$;

-- ── rqth_employees ──
DROP POLICY IF EXISTS "org_members_read_rqth" ON rqth_employees;
CREATE POLICY "org_members_read_rqth"
  ON rqth_employees FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND (
      auth_user_establishment_id() IS NULL
      OR rqth_employees.establishment_id = auth_user_establishment_id()
      OR rqth_employees.establishment_id IS NULL
    )
  );

DROP POLICY IF EXISTS "admin_charge_write_rqth" ON rqth_employees;
CREATE POLICY "admin_charge_write_rqth"
  ON rqth_employees FOR ALL
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'charge_site'))
    AND (
      auth_user_establishment_id() IS NULL
      OR rqth_employees.establishment_id = auth_user_establishment_id()
      OR rqth_employees.establishment_id IS NULL
    )
  );

-- ── esat_purchases ──
DROP POLICY IF EXISTS "org_members_read_esat" ON esat_purchases;
CREATE POLICY "org_members_read_esat"
  ON esat_purchases FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND (
      auth_user_establishment_id() IS NULL
      OR esat_purchases.establishment_id = auth_user_establishment_id()
      OR esat_purchases.establishment_id IS NULL
    )
  );

DROP POLICY IF EXISTS "admin_charge_write_esat" ON esat_purchases;
CREATE POLICY "admin_charge_write_esat"
  ON esat_purchases FOR ALL
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'charge_site'))
    AND (
      auth_user_establishment_id() IS NULL
      OR esat_purchases.establishment_id = auth_user_establishment_id()
      OR esat_purchases.establishment_id IS NULL
    )
  );

-- ── budget_allocations ──
DROP POLICY IF EXISTS "org_members_read_budget_alloc" ON budget_allocations;
CREATE POLICY "org_members_read_budget_alloc"
  ON budget_allocations FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND (
      auth_user_establishment_id() IS NULL
      OR budget_allocations.establishment_id = auth_user_establishment_id()
      OR budget_allocations.establishment_id IS NULL
    )
  );

DROP POLICY IF EXISTS "admin_charge_write_budget_alloc" ON budget_allocations;
CREATE POLICY "admin_charge_write_budget_alloc"
  ON budget_allocations FOR ALL
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'charge_site'))
    AND (
      auth_user_establishment_id() IS NULL
      OR budget_allocations.establishment_id = auth_user_establishment_id()
      OR budget_allocations.establishment_id IS NULL
    )
  );

-- ── budget_expenses ──
DROP POLICY IF EXISTS "org_members_read_budget_exp" ON budget_expenses;
CREATE POLICY "org_members_read_budget_exp"
  ON budget_expenses FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND (
      auth_user_establishment_id() IS NULL
      OR budget_expenses.establishment_id = auth_user_establishment_id()
      OR budget_expenses.establishment_id IS NULL
    )
  );

DROP POLICY IF EXISTS "admin_charge_write_budget_exp" ON budget_expenses;
CREATE POLICY "admin_charge_write_budget_exp"
  ON budget_expenses FOR ALL
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'charge_site'))
    AND (
      auth_user_establishment_id() IS NULL
      OR budget_expenses.establishment_id = auth_user_establishment_id()
      OR budget_expenses.establishment_id IS NULL
    )
  );
