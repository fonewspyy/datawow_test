"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  active: (pathname: string) => boolean;
  onClick?: () => void;
  hidden?: boolean;
}

export function DashboardShell({ viewMode, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout, user } = useAuth();
  const canSwitchToAdmin = user?.role === "ADMIN";

  const items: NavItem[] = viewMode === "admin"
    ? [
        {
          label: "Home",
          href: "/admin",
          icon: "/icons/sidebar-home.png",
          active: (currentPath) => currentPath === "/admin",
        },
        {
          label: "History",
          href: "/admin/history",
          icon: "/icons/sidebar-history.png",
          active: (currentPath) => currentPath.startsWith("/admin/history"),
        },
        {
          label: "Switch to user",
          href: "/user",
          icon: "/icons/sidebar-switch.png",
          active: () => false,
        },
      ]
    : [
        {
          label: "Home",
          href: "/user",
          icon: "/icons/sidebar-home.png",
          active: (currentPath) => currentPath === "/user",
        },
        {
          label: "History",
          href: "/user/history",
          icon: "/icons/sidebar-history.png",
          active: (currentPath) => currentPath.startsWith("/user/history"),
        },
        {
          label: "Switch to Admin",
          href: "/admin",
          icon: "/icons/sidebar-switch.png",
          active: () => false,
          hidden: !canSwitchToAdmin,
        },
      ];

  const logoutItem: NavItem = {
    label: "Logout",
    icon: "/icons/sidebar-logout.png",
    active: () => false,
    onClick: () => {
      logout();
      router.replace("/login");
    },
  };

  return (
    <div className="dashboard-shell">
      <aside className={`dashboard-sidebar ${isSidebarOpen ? "is-open" : ""}`}>
        <div className="dashboard-sidebar-title">
          {viewMode === "admin" ? "Admin" : "User"}
        </div>
        <nav className="grid gap-3">
          {items.filter((item) => !item.hidden).map((item) => (
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className={`sidebar-link ${item.active(pathname) ? "is-active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Image src={item.icon} alt="" width={24} height={24} />
                <span>{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.label}
                className="sidebar-link text-left"
                onClick={() => {
                  setIsSidebarOpen(false);
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
          className="sidebar-link text-left"
          type="button"
          onClick={logoutItem.onClick}
        >
          <Image src={logoutItem.icon} alt="" width={24} height={24} />
          <span>{logoutItem.label}</span>
        </button>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-main-inner">
          <button
            className="mobile-sidebar-toggle"
            type="button"
            onClick={() => setIsSidebarOpen((currentValue) => !currentValue)}
          >
            {isSidebarOpen ? "Close menu" : "Open menu"}
          </button>
          {children}
        </div>
      </main>
    </div>
  );
}