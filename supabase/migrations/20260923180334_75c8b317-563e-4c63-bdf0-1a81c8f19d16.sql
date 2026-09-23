CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.gen_confirmation_code()
RETURNS text LANGUAGE plpgsql VOLATILE SET search_path = public, extensions AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(8);
  result text := '';
  i int;
BEGIN
  FOR i IN 0..7 LOOP
    result := result || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  END LOOP;
  RETURN result;
END; $$;

ALTER TABLE public.rsvps
  ADD COLUMN email text NOT NULL DEFAULT '' ,
  ADD COLUMN confirmation_code text NOT NULL DEFAULT public.gen_confirmation_code(),
  ADD COLUMN checked_in boolean NOT NULL DEFAULT false,
  ADD COLUMN checked_in_at timestamptz;
ALTER TABLE public.rsvps ALTER COLUMN email DROP DEFAULT;
ALTER TABLE public.rsvps ADD CONSTRAINT rsvps_confirmation_code_key UNIQUE (confirmation_code);
ALTER TABLE public.rsvps ADD CONSTRAINT rsvps_email_format CHECK (email = '' OR (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND char_length(email) <= 255));

DROP POLICY IF EXISTS "Anyone can submit an RSVP" ON public.rsvps;
CREATE POLICY "Anyone can submit an RSVP" ON public.rsvps FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(full_name) BETWEEN 2 AND 120
  AND guest_count BETWEEN 1 AND 10
  AND (notes IS NULL OR char_length(notes) <= 1000)
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND char_length(email) <= 255
  AND checked_in = false AND checked_in_at IS NULL
);

CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;