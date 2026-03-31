import { DashboardShell } from "@/components/dashboard-shell";
import { RouteGuard } from "@/components/route-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={["ADMIN"]}>
      <DashboardShell viewMode="admin">{children}</DashboardShell>
    </RouteGuard>
  );
}