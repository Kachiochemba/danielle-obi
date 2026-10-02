-- Prevent repeat RSVPs, including concurrent submissions. Gifts remain unrestricted.
CREATE UNIQUE INDEX IF NOT EXISTS rsvps_name_email_unique
ON public.rsvps (
  lower(regexp_replace(btrim(full_name), '\s+', ' ', 'g')),
  lower(btrim(email))
);
