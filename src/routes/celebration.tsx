import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/celebration")({
  head: () => ({
    meta: [
      { title: "Our Story, Venue and RSVP | Danielle & Obi" },
      { name: "description", content: "Danielle and Obi's love story, ceremony directions, and wedding RSVP for 14 November 2026." },
      { property: "og:title", content: "Our Story, Venue and RSVP | Danielle & Obi" },
      { property: "og:description", content: "Two Hearts, One Throne. Read our story and respond to our wedding invitation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Navigate to="/" hash="story" replace />,
});
