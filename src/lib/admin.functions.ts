import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = {
  supabase: {
    rpc: (
      fn: "has_role",
      args: { _user_id: string; _role: "admin" | "usher" },
    ) => PromiseLike<{ data: boolean | null }>;
  };
  userId: string;
};

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertCheckin(context: Ctx) {
  const roles = await Promise.all(
    ["admin", "usher"].map((role) =>
      context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: role as "admin" | "usher",
      }),
    ),
  );
  if (!roles.some(({ data }) => data === true)) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,16}$/),
});

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const { data: usher } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "usher",
    });
    return { admin: Boolean(data), usher: Boolean(usher) };
  });

async function tally(admin: Awaited<ReturnType<typeof assertAdmin>>) {
  const [attending, checked] = await Promise.all([
    admin.from("rsvps").select("id", { count: "exact", head: true }).eq("attending", true),
    admin
      .from("rsvps")
      .select("id", { count: "exact", head: true })
      .eq("attending", true)
      .eq("checked_in", true),
  ]);
  if (attending.error || checked.error) throw new Error("Could not load check-in totals.");
  return { attending: attending.count ?? 0, checkedIn: checked.count ?? 0 };
}

export const getCheckinTally = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => tally(await assertCheckin(context as unknown as Ctx)));

export const lookupRsvp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => codeSchema.parse(d))
  .handler(async ({ context, data }) => {
    const admin = await assertCheckin(context as unknown as Ctx);
    const { data: row, error } = await admin
      .from("rsvps")
      .select("confirmation_code, full_name, guest_count, attending, checked_in, checked_in_at")
      .eq("confirmation_code", data.code)
      .maybeSingle();
    if (error) throw new Error("Could not look up this invitation. Please try again.");
    return { guest: row };
  });

export const checkInRsvp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => codeSchema.parse(d))
  .handler(async ({ context, data }) => {
    const admin = await assertCheckin(context as unknown as Ctx);
    const { data: updated, error: updateError } = await admin
      .from("rsvps")
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("confirmation_code", data.code)
      .eq("attending", true)
      .eq("checked_in", false)
      .select("confirmation_code, full_name, guest_count, attending, checked_in, checked_in_at")
      .maybeSingle();
    if (updateError) throw new Error("Could not check in this guest. Please try again.");
    const { data: current, error: lookupError } = updated
      ? { data: updated, error: null }
      : await admin
          .from("rsvps")
          .select("confirmation_code, full_name, guest_count, attending, checked_in, checked_in_at")
          .eq("confirmation_code", data.code)
          .maybeSingle();
    if (lookupError) throw new Error("Could not verify check-in. Please try again.");
    return {
      guest: current,
      alreadyCheckedIn: !updated && Boolean(current?.checked_in),
      tally: await tally(admin),
    };
  });

export const listRsvps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context as unknown as Ctx);
    const snapshotAt = new Date().toISOString();
    const fetchPage = (offset: number) =>
      admin
        .from("rsvps")
        .select(
          "id, full_name, email, guest_count, attending, notes, submitted_at, checked_in, checked_in_at",
        )
        .lte("submitted_at", snapshotAt)
        .order("submitted_at", { ascending: false })
        .order("id")
        .range(offset, offset + 999);
    const first = await fetchPage(0);
    if (first.error) throw new Error("Could not load RSVPs. Please try again.");
    const rows = first.data ?? [];
    let pageLength = rows.length;
    while (pageLength === 1000) {
      const page = await fetchPage(rows.length);
      if (page.error) throw new Error("Could not load RSVPs. Please try again.");
      rows.push(...(page.data ?? []));
      pageLength = page.data?.length ?? 0;
    }
    return { rows, snapshotAt };
  });

export const deleteRsvp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context as unknown as Ctx);
    const { error, count } = await admin.from("rsvps").delete({ count: "exact" }).eq("id", data.id);
    if (error) throw new Error("Could not delete this RSVP. Please try again.");
    return { deleted: count ?? 0 };
  });

export const clearRsvps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        confirmation: z.literal("DELETE ALL"),
        before: z
          .string()
          .datetime()
          .refine(
            (value) => Date.parse(value) <= Date.now(),
            "Refresh the guest list and try again.",
          ),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context as unknown as Ctx);
    // Preserve submissions arriving after the list being confirmed was loaded.
    const { error, count } = await admin
      .from("rsvps")
      .delete({ count: "exact" })
      .lte("submitted_at", data.before);
    if (error) throw new Error("Could not clear the guest list. Please try again.");
    return { deleted: count ?? 0 };
  });
