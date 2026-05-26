-- Migration 003 : Abonnements Stripe

-- Colonnes de souscription sur la table organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS plan_id            text CHECK (plan_id IN ('solo', 'pro', 'groupe', 'cabinet_rh')) DEFAULT 'pro',
  ADD COLUMN IF NOT EXISTS billing_cycle      text CHECK (billing_cycle IN ('monthly', 'annual_monthly', 'annual_prepaid')),
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trialing'
                                              CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id      text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  text UNIQUE,
  ADD COLUMN IF NOT EXISTS current_period_end      timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at           timestamptz DEFAULT (now() + interval '14 days');

-- Table d'événements Stripe pour audit et débogage
CREATE TABLE IF NOT EXISTS subscription_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type        text NOT NULL,
  plan_id           text,
  billing_cycle     text,
  stripe_event_id   text UNIQUE,
  payload           jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_subscription_events_org ON subscription_events (organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created ON subscription_events (created_at DESC);

-- RLS : subscription_events accessible par les admins de l'organisation
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can read own org events"
  ON subscription_events FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
