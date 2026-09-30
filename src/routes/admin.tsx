import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { AdminAccess } from "@/components/AdminAccess";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin | Danielle & Obi" },
      {
        name: "description",
        content: "Private check-in and guest list for Danielle and Obi's wedding.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminAccess>
      <>
        {" "}
        <nav
          aria-label="Admin navigation"
          className="flex flex-wrap items-center gap-2 border-b border-gold/25 pb-3"
        >
          <span className="mr-auto font-script text-2xl text-wine">D & O</span>
          {(
            [
              ["/admin", "Dashboard"],
              ["/admin/rsvps", "Guest list"],
              ["/admin/checkin", "Check-in"],
            ] as const
          ).map(([to, label]) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              className="rounded-sm px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:bg-wine-deep active:text-cream"
              activeProps={{ className: "bg-wine text-cream hover:bg-wine-deep hover:text-cream" }}
              inactiveProps={{ className: "text-wine hover:bg-wine hover:text-cream" }}
            >
              {label}
            </Link>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-wine hover:bg-wine hover:text-cream active:bg-wine-deep active:text-cream"
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </Button>
        </nav>
        <Outlet />
      </>
    </AdminAccess>
  );
}
