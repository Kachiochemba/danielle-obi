# Danielle & Obi — Wedding Invitation

A digital wedding invitation and RSVP site for Danielle & Obi's wedding (14 November 2026, Lagos, Nigeria). Guests open an animated envelope, browse the invitation, ceremony/reception details, the couple's story, venue, and gifts, then RSVP and receive a QR-coded confirmation used for day-of check-in.

Originally built with [Lovable](https://lovable.dev) and connected to GitHub for two-way sync — edits made in Lovable push here as commits, and commits pushed here sync back into Lovable's editor.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React, file-based routing, server functions/SSR)
- TypeScript
- Tailwind CSS v4
- Framer Motion (envelope open/close animation)
- [Supabase](https://supabase.com) (Postgres database, RLS, auth for the admin area)
- Deploys to Cloudflare (the build already targets Cloudflare via Nitro — see `vite.config.ts`)

## Project structure

```
src/
  components/wedding/   # Envelope gate, invitation card, details, story, venue,
                         # RSVP form, gifts, site nav — the actual page sections
  data/wedding.ts        # All couple/event content (names, date, venue, dress code,
                          # timeline, etc.) — edit this file to change wedding details
  routes/                # File-based routes (TanStack Router)
    index.tsx             # Main invitation site
    admin.tsx, admin.checkin.tsx, admin.rsvps.tsx   # Admin-only area (see below)
    checkin.$code.tsx      # Public QR check-in landing route
  lib/                   # Server functions (*.functions.ts, *.server.ts) —
                          # RSVP submission, admin queries, email sending
  integrations/supabase/ # Generated Supabase clients (client-side + server/admin)
supabase/
  migrations/            # Database schema (rsvps table, RLS policies, etc.)
```

## Local development

Requires Node.js (or Bun — a `bun.lock` is included, either package manager works).

```sh
git clone <this-repository-url>
cd <repository-name>
npm install        # or: bun install
cp .env.example .env
# fill in SUPABASE_SERVICE_ROLE_KEY in .env — get it from
# Supabase Dashboard -> Project Settings -> API -> service_role key.
# Never commit the real value.
npm run dev         # or: bun run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`, `npm run format`.

## Environment variables

See `.env.example` for the full list. Summary:

| Variable | Where it's used | Secret? |
|---|---|---|
| `VITE_SUPABASE_URL`, `SUPABASE_URL` | Client + server Supabase connection | No — public |
| `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PUBLISHABLE_KEY` | Client + server Supabase connection | No — public |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — admin queries, RSVP writes, check-in | **Yes — never commit or expose client-side** |
| `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` / `GMAIL_REFRESH_TOKEN` | Planned — RSVP confirmation/notification email (not yet implemented) | **Yes, once added** |

## Database

Schema and RLS policies live in `supabase/migrations/`. The `rsvps` table accepts public inserts only (RLS-enforced) — guests can submit an RSVP, but reading or updating the list requires the service-role key from a trusted server route (used by the admin pages), never exposed to the browser.

## Admin area

`/admin/rsvps` (guest list, CSV export) and `/admin/checkin` (QR scanner for day-of check-in) require a logged-in Supabase Auth account. There is no public sign-up — create admin accounts manually in the Supabase Dashboard under **Authentication → Users → Add user**, one per person who needs access (the couple, plus anyone working the door on the day).

## Deployment (Cloudflare)

This project already builds for Cloudflare by default (see the comment in `vite.config.ts` — Lovable's TanStack config uses Nitro's `cloudflare` preset). To deploy your own copy:

1. Connect this repository to Cloudflare Pages/Workers.
2. Build command: `npm run build` (or `bun run build`).
3. Add the same environment variables from `.env.example` — including the real `SUPABASE_SERVICE_ROLE_KEY` — as secrets in the Cloudflare project settings. They are **not** shared automatically from Lovable or from your local `.env`.
4. Because this app has server-side routes (RSVP submission, admin queries, check-in), it needs to run as Workers/Functions, not a static-only deploy — the existing build config already produces the right output for that.

## Status / known gaps

- RSVP confirmation and internal notification emails are not yet sending — `src/lib/rsvp-notify.server.ts` is currently a stub. Planned implementation uses the Gmail API (HTTPS-based, works on Cloudflare) to send from `ochembaonyekachi.t@gmail.com`, since standard SMTP isn't reliably supported on Cloudflare's runtime.
- Photo gallery / additional couple photos not yet added.

## License

Private project — all rights reserved. Not licensed for reuse.
