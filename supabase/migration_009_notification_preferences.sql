-- Migration 009 : Préférences de notifications par organisation
-- Permet de persister les toggles d'alertes email (RQTH, obligations légales)

CREATE TABLE IF NOT EXISTS notification_preferences (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  alerte_rqth           boolean NOT NULL DEFAULT true,
  alerte_obligations    boolean NOT NULL DEFAULT true,
  email_referent        text,             -- email de destination optionnel (sinon email du compte)
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),

  UNIQUE (organization_id)
);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_notif_prefs"
  ON notification_preferences FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "admin_manage_notif_prefs"
  ON notification_preferences FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger updated_at
CREATE OR REPLACE TRIGGER set_updated_at_notif_prefs
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
