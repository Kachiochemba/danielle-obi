import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/wedding/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Danielle & Obi | Wedding Invitation" },
      { name: "description", content: "Join Danielle and Obi for their wedding in Lagos on 14 November 2026." },
      { property: "og:title", content: "Danielle & Obi | Wedding Invitation" },
      { property: "og:description", content: "Two Hearts, One Throne. You are warmly invited to celebrate with us." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
