import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null }> }; userId: string };

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const codeSchema = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,16}$/) });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { admin: Boolean(data) };
  });

async function tally(admin: Awaited<ReturnType<typeof assertAdmin>>) {
  const { data } = await admin.from("rsvps").select("checked_in").eq("attending", true);
  const rows = data ?? [];
  return { attending: rows.length, checkedIn: rows.filter((r) => r.checked_in).length };
}

export const getCheckinTally = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => tally(await assertAdmin(context as unknown as Ctx)));

export const lookupRsvp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => codeSchema.parse(d))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context as unknown as Ctx);
    const { data: row } = await admin.from("rsvps")
      .select("confirmation_code, full_name, guest_count, attending, checked_in, checked_in_at")
      .eq("confirmation_code", data.code).maybeSingle();
    return { guest: row };
  });

export const checkInRsvp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => codeSchema.parse(d))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context as unknown as Ctx);
    const { data: updated } = await admin.from("rsvps")
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("confirmation_code", data.code).eq("checked_in", false)
      .select("confirmation_code, full_name, guest_count, attending, checked_in, checked_in_at").maybeSingle();
    const { data: current } = updated ? { data: updated } : await admin.from("rsvps")
      .select("confirmation_code, full_name, guest_count, attending, checked_in, checked_in_at")
      .eq("confirmation_code", data.code).maybeSingle();
    return { guest: current, alreadyCheckedIn: !updated && Boolean(current), tally: await tally(admin) };
  });

export const listRsvps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context as unknown as Ctx);
    const { data } = await admin.from("rsvps")
      .select("id, full_name, email, guest_count, attending, notes, submitted_at, checked_in, checked_in_at")
      .order("submitted_at", { ascending: false });
    return { rows: data ?? [] };
  });
