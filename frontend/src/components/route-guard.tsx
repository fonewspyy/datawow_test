"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/lib/types";

export function RouteGuard({
  allowedRoles,
  children,
}: {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, user } = useAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(user.role === "ADMIN" ? "/admin" : "/user");
    }
  }, [allowedRoles, isReady, pathname, router, user]);

  if (!isReady || !user) {
    return <div className="dashboard-loading">Loading dashboard…</div>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="dashboard-loading">Redirecting…</div>;
  }

  return <>{children}</>;
}