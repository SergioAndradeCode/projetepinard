-- Migration 015 : politiques RLS pour le rôle charge_mission
-- La migration 005 a ajouté le rôle dans profiles mais oublié de mettre à jour
-- les politiques d'écriture (FOR ALL) des tables opérationnelles.
-- charge_mission = rôle local, limité à son établissement.

-- ── budget_expenses ──────────────────────────────────────────────────────────
-- Avant : seulement admin, charge_site
-- Après : admin, charge_site, charge_mission (scopé à son établissement)

DROP POLICY IF EXISTS "admin_charge_write_budget_exp" ON budget_expenses;
CREATE POLICY "admin_charge_write_budget_exp"
  ON budget_expenses FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'charge_site', 'charge_mission')
    )
    AND (
      auth_user_establishment_id() IS NULL
      OR budget_expenses.establishment_id = auth_user_establishment_id()
      OR budget_expenses.establishment_id IS NULL
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'charge_site', 'charge_mission')
    )
    AND (
      auth_user_establishment_id() IS NULL
      OR establishment_id = auth_user_establishment_id()
      OR establishment_id IS NULL
    )
  );

-- ── rqth_employees ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_charge_write_rqth" ON rqth_employees;
CREATE POLICY "admin_charge_write_rqth"
  ON rqth_employees FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'charge_site', 'charge_mission')
    )
    AND (
      auth_user_establishment_id() IS NULL
      OR rqth_employees.establishment_id = auth_user_establishment_id()
      OR rqth_employees.establishment_id IS NULL
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'charge_site', 'charge_mission')
    )
    AND (
      auth_user_establishment_id() IS NULL
      OR establishment_id = auth_user_establishment_id()
      OR establishment_id IS NULL
    )
  );

-- ── esat_purchases ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_charge_write_esat" ON esat_purchases;
CREATE POLICY "admin_charge_write_esat"
  ON esat_purchases FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'charge_site', 'charge_mission')
    )
    AND (
      auth_user_establishment_id() IS NULL
      OR esat_purchases.establishment_id = auth_user_establishment_id()
      OR esat_purchases.establishment_id IS NULL
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'charge_site', 'charge_mission')
    )
    AND (
      auth_user_establishment_id() IS NULL
      OR establishment_id = auth_user_establishment_id()
      OR establishment_id IS NULL
    )
  );

-- ── calendar_events ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_charge_write_calendar_events" ON calendar_events;
CREATE POLICY "admin_charge_write_calendar_events"
  ON calendar_events FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'charge_site', 'charge_mission')
    )
    AND (
      auth_user_establishment_id() IS NULL
      OR calendar_events.establishment_id = auth_user_establishment_id()
      OR calendar_events.establishment_id IS NULL
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'charge_site', 'charge_mission')
    )
    AND (
      auth_user_establishment_id() IS NULL
      OR establishment_id = auth_user_establishment_id()
      OR establishment_id IS NULL
    )
  );
