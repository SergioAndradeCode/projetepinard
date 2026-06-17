-- Module paiement B2B par virement bancaire
-- Crée la table orders pour les commandes sans Stripe

CREATE TABLE IF NOT EXISTS orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number        TEXT UNIQUE NOT NULL,
  company_name          TEXT NOT NULL,
  siret                 TEXT NOT NULL,
  billing_address       TEXT NOT NULL,
  postal_code           TEXT NOT NULL,
  city                  TEXT NOT NULL,
  country               TEXT NOT NULL DEFAULT 'France',
  contact_firstname     TEXT NOT NULL,
  contact_lastname      TEXT NOT NULL,
  contact_function      TEXT,
  contact_email         TEXT NOT NULL,
  contact_phone         TEXT,
  plan                  TEXT NOT NULL CHECK (plan IN ('essentiel', 'equipe', 'organisation')),
  billing_cycle         TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual_monthly', 'annual_upfront')),
  amount_ht             NUMERIC(10,2) NOT NULL,
  amount_tva            NUMERIC(10,2) NOT NULL,
  amount_ttc            NUMERIC(10,2) NOT NULL,
  purchase_order_number TEXT,
  message               TEXT,
  status                TEXT NOT NULL DEFAULT 'pending_payment'
                        CHECK (status IN ('pending_payment', 'active', 'expired', 'cancelled')),
  activation_token      TEXT UNIQUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  activated_at          TIMESTAMPTZ,
  invoice_due_date      DATE NOT NULL
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Aucun accès public : seul le service role (backend) peut lire/écrire
CREATE POLICY "orders_service_role_only" ON orders
  FOR ALL
  TO authenticated
  USING (false);
