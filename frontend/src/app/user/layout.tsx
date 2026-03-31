import { DashboardShell } from "@/components/dashboard-shell";
import { RouteGuard } from "@/components/route-guard";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <DashboardShell viewMode="user">{children}</DashboardShell>
    </RouteGuard>
  );
}