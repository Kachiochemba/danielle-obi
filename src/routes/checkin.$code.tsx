import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/checkin/$code")({
  head: () => ({ meta: [{ title: "Check-in | Danielle & Obi" }, { name: "robots", content: "noindex" }] }),
  component: () => {
    const { code } = Route.useParams();
    return <Navigate to="/admin/checkin" search={{ code }} replace />;
  },
});
