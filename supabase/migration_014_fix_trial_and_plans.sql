-- Migration 014 : Correctifs essai gratuit et nouveaux plan IDs
--
-- Problème 1 : les orgs créées avant migration_003 ont trial_ends_at = NULL
--   → elles apparaissent comme expirées dans le SubscriptionContext
--   → on leur attribue 10 jours à partir d'aujourd'hui
--
-- Problème 2 : la contrainte plan_id référençait les anciens IDs (solo, pro, cabinet_rh)
--   → mise à jour vers les nouveaux IDs (essentiel, equipe, organisation, groupe)

-- 1. Corriger les orgs sans date d'essai
UPDATE organizations
SET trial_ends_at = now() + interval '10 days'
WHERE trial_ends_at IS NULL
  AND subscription_status = 'trialing';

-- 2. Mettre à jour la contrainte plan_id vers les nouveaux IDs
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_plan_id_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_plan_id_check
    CHECK (plan_id IN ('essentiel', 'equipe', 'organisation', 'groupe'));

-- 3. Migrer les anciens plan_id vers les nouveaux équivalents
UPDATE organizations SET plan_id = 'essentiel'    WHERE plan_id = 'solo';
UPDATE organizations SET plan_id = 'equipe'       WHERE plan_id = 'pro';
UPDATE organizations SET plan_id = 'equipe'       WHERE plan_id = 'cabinet_rh';
-- 'groupe' reste 'groupe'

-- 4. Mettre à jour le DEFAULT de la colonne trial_ends_at à 10 jours
ALTER TABLE organizations
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '10 days');
