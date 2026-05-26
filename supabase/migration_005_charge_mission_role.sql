-- Migration 005 : ajout du rôle charge_mission
-- Ce rôle correspond au "Chargé(e) de Mission Handicap" (local/technique, site-spécifique, ne peut pas inviter)

-- Mettre à jour la contrainte CHECK sur profiles.role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'charge_site', 'charge_mission', 'lecteur'));
