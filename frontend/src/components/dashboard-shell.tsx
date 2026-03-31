"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useEffectEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

type ViewMode = "admin" | "user";

interface DashboardShellProps {
  viewMode: ViewMode;
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href?: string;
  icon: string;
  isActive: boolean;
  onClick?: () => void;
  hidden?: boolean;
}

export function DashboardShell({ viewMode, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout, user } = useAuth();
  const canSwitchToAdmin = user?.role === "ADMIN";

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const closeSidebarOnPathChange = useEffectEvent(() => {
    startTransition(() => {
      setIsSidebarOpen(false);
    });
  });

  /* Close sidebar whenever route changes (covers programmatic navigation) */
  useEffect(() => {
    closeSidebarOnPathChange();
  }, [pathname]);

  /* Prevent body scroll when mobile sidebar is open + close on Escape */
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    if (isSidebarOpen) window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isSidebarOpen, closeSidebar]);

  const items: NavItem[] = viewMode === "admin"
    ? [
        {
          label: "Home",
          href: "/admin",
          icon: "/icons/sidebar-home.png",
          isActive: pathname === "/admin",
        },
        {
          label: "History",
          href: "/admin/history",
          icon: "/icons/sidebar-history.png",
          isActive: pathname.startsWith("/admin/history"),
        },
        {
          label: "Switch to user",
          href: "/user",
          icon: "/icons/sidebar-switch.png",
          isActive: false,
        },
      ]
    : [
        {
          label: "Home",
          href: "/user",
          icon: "/icons/sidebar-home.png",
          isActive: pathname === "/user",
        },
        {
          label: "History",
          href: "/user/history",
          icon: "/icons/sidebar-history.png",
          isActive: pathname.startsWith("/user/history"),
        },
        {
          label: "Switch to Admin",
          href: "/admin",
          icon: "/icons/sidebar-switch.png",
          isActive: false,
          hidden: !canSwitchToAdmin,
        },
      ];

  return (
    <div className="dashboard-shell">
      {/* Backdrop — click to close sidebar on mobile */}
      {isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside className={`dashboard-sidebar ${isSidebarOpen ? "is-open" : ""}`}>
        <div className="dashboard-sidebar-header">
          <div className="dashboard-sidebar-title">
            {viewMode === "admin" ? "Admin" : "User"}
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.filter((item) => !item.hidden).map((item) => (
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className={`sidebar-link${item.isActive ? " is-active" : ""}`}
                onClick={closeSidebar}
              >
                <Image src={item.icon} alt="" width={24} height={24} />
                <span>{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.label}
                className="sidebar-link"
                onClick={() => {
                  closeSidebar();
                  item.onClick?.();
                }}
                type="button"
              >
                <Image src={item.icon} alt="" width={24} height={24} />
                <span>{item.label}</span>
              </button>
            )
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <button
          className="sidebar-link"
          type="button"
          onClick={() => {
            closeSidebar();
            logout();
            router.replace("/login");
          }}
        >
          <Image src="/icons/sidebar-logout.png" alt="" width={24} height={24} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-main-inner">
          {/* Hamburger toggle — visible only on mobile */}
          {!isSidebarOpen ? (
            <button
              className="mobile-sidebar-toggle"
              type="button"
              aria-label="Open menu"
              aria-expanded={false}
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="hamburger">
                <span />
                <span />
                <span />
              </span>
            </button>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
