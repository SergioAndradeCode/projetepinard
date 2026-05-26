-- Migration 010 : Rôle utilisateur dans le JWT Supabase
-- Permet au middleware de lire le rôle depuis le JWT (user.app_metadata.role)
-- sans faire un round-trip DB sur chaque requête.
--
-- INSTRUCTIONS D'APPLICATION :
-- 1. Appliquer ce SQL dans l'éditeur Supabase (Dashboard > SQL Editor)
-- 2. Dans Dashboard > Authentication > Hooks, activer "Custom Access Token"
--    et pointer vers la fonction `custom_access_token_hook`
-- -------------------------------------------------------------------------

-- Fonction appelée à chaque émission de token JWT
-- Injecte le rôle Talenth dans app_metadata.talenth_role
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims   jsonb;
  user_role text;
BEGIN
  -- Récupérer le rôle depuis la table profiles
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  -- Injecter le rôle dans app_metadata
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(
      claims,
      '{app_metadata}',
      COALESCE(claims->'app_metadata', '{}') || jsonb_build_object('talenth_role', user_role)
    );
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Accorder les droits nécessaires au service role Supabase Auth
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- Trigger : mettre à jour app_metadata quand le profil change
-- (via appel à l'API Auth Admin depuis une Edge Function — voir supabase/functions/sync-role)
-- Ce trigger crée un event dans une table de queue pour traitement asynchrone
CREATE TABLE IF NOT EXISTS public.role_sync_queue (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL,
  new_role    text NOT NULL,
  processed   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.role_sync_queue ENABLE ROW LEVEL SECURITY;
-- Seul le service role peut lire/écrire cette table
CREATE POLICY "service_role_only" ON public.role_sync_queue
  USING (false);  -- bloque tous les accès directs clients

CREATE OR REPLACE FUNCTION public.queue_role_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.role_sync_queue (user_id, new_role)
    VALUES (NEW.id, NEW.role);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_role_on_profile_change ON public.profiles;
CREATE TRIGGER sync_role_on_profile_change
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.queue_role_sync();
