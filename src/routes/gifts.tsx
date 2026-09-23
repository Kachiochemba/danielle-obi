import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/gifts")({
  head: () => ({
    meta: [
      { title: "Gifts | Danielle & Obi" },
      { name: "description", content: "Your presence is the greatest gift. A few thoughtful ways to celebrate Danielle and Obi." },
      { property: "og:title", content: "Gifts | Danielle & Obi" },
      { property: "og:description", content: "Gift options and good wishes for Danielle and Obi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Navigate to="/" hash="gifts" replace />,
});
