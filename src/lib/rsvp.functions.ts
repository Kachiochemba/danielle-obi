import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  guests: z.number().int().min(1).max(10),
  attending: z.boolean(),
  notes: z.string().trim().max(1000).optional(),
});

export const submitRsvp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("rsvps")
      .insert({ full_name: data.fullName, email: data.email.toLowerCase(), guest_count: data.guests, attending: data.attending, notes: data.notes || null })
      .select("id, full_name, email, guest_count, attending, confirmation_code")
      .single();
    if (error || !row) {
      console.error("RSVP insert failed", error);
      return { ok: false as const };
    }
    try {
      const origin = new URL(getRequest().url).origin;
      const { notifyRsvp } = await import("./rsvp-notify.server");
      await notifyRsvp(row, origin);
    } catch (e) {
      console.error("RSVP email failed", e);
    }
    return { ok: true as const, code: row.confirmation_code };
  });
