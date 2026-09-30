import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { giftSubmissionSchema, type GiftPledge } from "./gifts.shared";
import catalog from "@/data/gift-catalog.json";

export const getGiftCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { giftDb } = await import("./gifts.server");
  const [reservations, active] = await Promise.all([
    giftDb.from("gift_reservations").select("gift_id"),
    giftDb.from("gift_catalog").select("id").eq("active", true),
  ]);
  if (reservations.error || active.error) throw new Error("Unable to load gifts");
  const reserved = new Set((reservations.data ?? []).map((r) => r.gift_id));
  const enabled = new Set((active.data ?? []).map((r) => r.id));
  return catalog
    .filter((g) => enabled.has(g.id))
    .map((g) => ({ ...g, reserved: reserved.has(g.id) }));
});
export const submitGift = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => giftSubmissionSchema.parse(d))
  .handler(async ({ data }) => {
    const { giftDb, notifyGift } = await import("./gifts.server");
    const { data: row, error } = await giftDb.rpc("submit_gift_entry", {
      p_id: data.requestId,
      p_name: data.fullName,
      p_email: data.email ?? null,
      p_kind: data.kind,
      p_amount: data.kind === "money" ? data.amount : null,
      p_items: data.kind === "items" ? data.items : [],
      p_wish: data.kind === "wish" ? data.wish : null,
    });
    if (error)
      return {
        ok: false as const,
        message: error.message.includes("GIFT_UNAVAILABLE")
          ? "One of these gifts was just reserved by another guest. Please choose from the available gifts."
          : "We could not save your gift. Please try again.",
      };
    const pledge = row as GiftPledge;
    await notifyGift(pledge);
    return { ok: true as const, kind: pledge.kind, amount: pledge.amount, items: pledge.items };
  });
export const listGiftHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!role.data) throw new Error("Forbidden");
    const { giftDb } = await import("./gifts.server");
    const rows: GiftPledge[] = [];
    for (let offset = 0; ; offset += 1000) {
      const page = await giftDb
        .from("gift_pledges")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id")
        .range(offset, offset + 999);
      if (page.error) throw new Error("Could not load gifting history");
      rows.push(...(page.data as GiftPledge[]));
      if (page.data.length < 1000) break;
    }
    return rows;
  });
export const retryGiftNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const role = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!role.data) throw new Error("Forbidden");
    const { giftDb, notifyGift } = await import("./gifts.server");
    const result = await giftDb.from("gift_pledges").select("*").eq("id", data.id).single();
    if (result.error) throw new Error("Gift not found");
    return { sent: await notifyGift(result.data as GiftPledge) };
  });

export const deleteGiftRecords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(10000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const role = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (role.error || !role.data) throw new Error("Forbidden");
    const { giftDb } = await import("./gifts.server");
    const result = await giftDb.rpc("delete_gift_records", { p_ids: [...new Set(data.ids)] });
    if (result.error) throw new Error("Could not delete gifts. Please try again.");
    return { deleted: Number(result.data) };
  });
