import { createServerFn } from "@tanstack/react-start";
import { wedding } from "@/data/wedding";

// Returns signed links for the couple's photos stored in the wedding-photos bucket.
export const getPhotoUrls = createServerFn({ method: "GET" }).handler(async () => {
  const names = [...wedding.story.map((s) => s.image), ...wedding.gallery.map((g) => g.file)];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from("wedding-photos").createSignedUrls(names, 60 * 60 * 24 * 7);
  const urls: Record<string, string> = {};
  for (const item of data ?? []) if (item.path && item.signedUrl && !item.error) urls[item.path] = item.signedUrl;
  return { urls };
});
