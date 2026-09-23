CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  guest_count INTEGER NOT NULL CHECK (guest_count BETWEEN 1 AND 10),
  attending BOOLEAN NOT NULL,
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 1000),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.rsvps TO anon, authenticated;
GRANT ALL ON public.rsvps TO service_role;

ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an RSVP"
ON public.rsvps
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(full_name) BETWEEN 2 AND 120
  AND guest_count BETWEEN 1 AND 10
  AND (notes IS NULL OR char_length(notes) <= 1000)
);