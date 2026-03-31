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

type SidebarPhase = "closed" | "opening" | "open" | "closing";

const SIDEBAR_TRANSITION_MS = 220;

export function DashboardShell({ viewMode, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarPhase, setSidebarPhase] = useState<SidebarPhase>("closed");
  const { logout, user } = useAuth();
  const canSwitchToAdmin = user?.role === "ADMIN";
  const isSidebarVisible = sidebarPhase !== "closed";
  const isSidebarExpanded = sidebarPhase === "opening" || sidebarPhase === "open";
  const isMobileToggleVisible = sidebarPhase === "closed";

  const openSidebar = useCallback(() => {
    setSidebarPhase((currentPhase) => {
      if (currentPhase === "open" || currentPhase === "opening") {
        return currentPhase;
      }

      return "opening";
    });
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarPhase((currentPhase) => {
      if (currentPhase === "closed" || currentPhase === "closing") {
        return currentPhase;
      }

      return "closing";
    });
  }, []);

  const closeSidebarOnPathChange = useEffectEvent(() => {
    startTransition(() => {
      setSidebarPhase((currentPhase) => {
        if (currentPhase === "open" || currentPhase === "opening") {
          return "closing";
        }

        return currentPhase;
      });
    });
  });

  /* Close sidebar whenever route changes (covers programmatic navigation) */
  useEffect(() => {
    closeSidebarOnPathChange();
  }, [pathname]);

  /* Prevent body scroll when mobile sidebar is open + close on Escape */
  useEffect(() => {
    document.body.style.overflow = isSidebarVisible ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    if (isSidebarVisible) window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isSidebarVisible, closeSidebar]);

  useEffect(() => {
    if (sidebarPhase !== "opening" && sidebarPhase !== "closing") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSidebarPhase((currentPhase) => {
        if (currentPhase === "opening") {
          return "open";
        }

        if (currentPhase === "closing") {
          return "closed";
        }

        return currentPhase;
      });
    }, SIDEBAR_TRANSITION_MS + 40);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [sidebarPhase]);

  const handleSidebarTransitionEnd = useCallback((event: React.TransitionEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== "transform") {
      return;
    }

    setSidebarPhase((currentPhase) => {
      if (currentPhase === "opening") {
        return "open";
      }

      if (currentPhase === "closing") {
        return "closed";
      }

      return currentPhase;
    });
  }, []);

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
      {isSidebarVisible && (
        <div
          className={`sidebar-backdrop${isSidebarExpanded ? " is-visible" : ""}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        id="dashboard-sidebar"
        className={`dashboard-sidebar${isSidebarExpanded ? " is-open" : ""}`}
        onTransitionEnd={handleSidebarTransitionEnd}
      >
        <button className="sr-only" type="button" onClick={closeSidebar}>
          Close menu
        </button>

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
                <Image className="sidebar-icon" src={item.icon} alt="" width={20} height={20} />
                <span className="sidebar-label">{item.label}</span>
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
                <Image className="sidebar-icon" src={item.icon} alt="" width={20} height={20} />
                <span className="sidebar-label">{item.label}</span>
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
          <Image className="sidebar-icon" src="/icons/sidebar-logout.png" alt="" width={20} height={20} />
          <span className="sidebar-label">Logout</span>
        </button>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-main-inner">
          {/* Hamburger toggle — visible only on mobile */}
          <button
            className={`mobile-sidebar-toggle${isMobileToggleVisible ? "" : " is-hidden"}`}
            type="button"
            aria-label="Open menu"
            aria-controls="dashboard-sidebar"
            onClick={openSidebar}
          >
            <span className="hamburger">
              <span />
              <span />
              <span />
            </span>
          </button>
          {children}
        </div>
      </main>
    </div>
  );
}
