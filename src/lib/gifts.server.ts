import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type GiftPledge, naira } from "./gifts.shared";
export const giftDb = supabaseAdmin as unknown as SupabaseClient;
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
export async function notifyGift(row: GiftPledge) {
  if (row.notification_sent_at) return true;
  const key = process.env["RESEND_API_KEY"];
  if (!key) return false;
  const detail =
    row.kind === "money"
      ? `pledged ${naira(Number(row.amount))}`
      : `reserved: ${row.items.map((i) => i.name).join(", ")}`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "Idempotency-Key": `gift-${row.id}`,
      },
      body: JSON.stringify({
        from: process.env["RSVP_FROM_EMAIL"] || "Danielle & Obi <rsvp@danielleandobi.com.ng>",
        to: ["obialoochemba@gmail.com"],
        subject: `[Wedding gift] ${row.full_name} · ${row.kind === "money" ? "Monetary pledge" : "Gift reservation"}`,
        html: `<div style="font-family:Georgia,serif;color:#4a1424;padding:24px"><h1>A wedding gift from ${esc(row.full_name)}</h1><p>Hey Obi, ${esc(row.full_name)} (${esc(row.email)}) ${esc(detail)}.</p><p>${row.kind === "money" ? "This is a pledge, not confirmation of a bank transfer." : "These gifts are now reserved and unavailable to other guests. This is not confirmation of purchase or delivery."}</p><p><a href="https://www.danielleandobi.com.ng/gift-history">View gifting history</a></p></div>`,
      }),
    });
    if (!res.ok) {
      console.error("Gift notification failed", res.status);
      return false;
    }
    const { error } = await giftDb
      .from("gift_pledges")
      .update({ notification_sent_at: new Date().toISOString() })
      .eq("id", row.id);
    return !error;
  } catch {
    console.error("Gift notification could not be sent");
    return false;
  }
}
