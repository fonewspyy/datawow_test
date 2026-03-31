"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConcertCard } from "@/components/concert-card";
import { CreateConcertForm } from "@/components/create-concert-form";
import { DeleteModal } from "@/components/delete-modal";
import { StatCard } from "@/components/stat-card";
import { TabSwitcher } from "@/components/tab-switcher";
import { Toast, type ToastMessage } from "@/components/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { api, ApiError, extractFieldErrors, NetworkError } from "@/lib/api";
import type { ConcertItem, DashboardStats } from "@/lib/types";

const defaultStats: DashboardStats = {
  totalSeats: 0,
  reservedSeats: 0,
  cancelledReservations: 0,
};

export function AdminDashboard() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [concerts, setConcerts] = useState<ConcertItem[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "create">("overview");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ConcertItem | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    void refresh(token);
  }, [token]);

  function handleAuthError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      logout();
      router.push("/login?next=/admin");
      return true;
    }
    return false;
  }

  async function refresh(currentToken: string) {
    try {
      setFetchError(null);
      const [concertItems, dashboardStats] = await Promise.all([
        api.concerts(currentToken),
        api.stats(currentToken),
      ]);
      setConcerts(concertItems);
      setStats(dashboardStats);
    } catch (error) {
      if (handleAuthError(error)) return;
      const msg = error instanceof NetworkError
        ? error.message
        : error instanceof ApiError
          ? error.message
          : "Failed to load data. Please try again.";
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(message: string, tone: ToastMessage["tone"] = "success") {
    const toastId = Date.now();
    setToastMessages((currentToasts) => [
      ...currentToasts,
      { id: toastId, message, tone },
    ]);
  }

  return (
    <>
      {isLoading ? (
        <p className="dashboard-loading">Loading dashboard…</p>
      ) : fetchError ? (
        <div className="fetch-error-banner">
          <p>{fetchError}</p>
          <button className="base-button button-primary" onClick={() => { if (token) { setIsLoading(true); void refresh(token); } }} type="button">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              icon="/icons/statcard-seats.png"
              label="Total of seats"
              value={stats.totalSeats}
              tone="seat"
            />
            <StatCard
              icon="/icons/statcard-reserve.png"
              label="Reserve"
              value={stats.reservedSeats}
              tone="reserve"
            />
            <StatCard
              icon="/icons/statcard-cancel.png"
              label="Cancel"
              value={stats.cancelledReservations}
              tone="cancel"
            />
          </div>

          <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === "overview" ? (
            <section className="content-section">
              <div className="concert-list">
                {concerts.length === 0 ? (
                  <p className="empty-state">No concerts yet. Switch to the Create tab to add one.</p>
                ) : (
                  concerts.map((concert) => (
                    <ConcertCard
                      key={concert.id}
                      concert={concert}
                      mode="admin"
                      isBusy={busyKey === `delete-${concert.id}`}
                      onDelete={setDeleteTarget}
                    />
                  ))
                )}
              </div>
            </section>
          ) : (
            <CreateConcertForm
              fieldErrors={fieldErrors}
              isSubmitting={busyKey === "create"}
              onClearFieldError={(field) => setFieldErrors((prev) => { const { [field]: _, ...rest } = prev; return rest; })}
              onSubmit={async (payload) => {
                if (!token) {
                  return false;
                }

                setBusyKey("create");
                setFieldErrors({});

                try {
                  await api.createConcert(token, payload);
                  await refresh(token);
                  setActiveTab("overview");
                  showToast("Create successfully");
                  return true;
                } catch (error) {
                  if (handleAuthError(error)) return false;
                  if (error instanceof ApiError) {
                    setFieldErrors(extractFieldErrors(error));
                    showToast(error.message, "error");
                  } else if (error instanceof NetworkError) {
                    showToast(error.message, "error");
                  } else {
                    showToast("Something went wrong. Please try again.", "error");
                  }
                  return false;
                } finally {
                  setBusyKey(null);
                }
              }}
            />
          )}
        </>
      )}

      {deleteTarget ? (
        <DeleteModal
          concertName={deleteTarget.name}
          isBusy={busyKey === `delete-${deleteTarget.id}`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if (!token) {
              return;
            }

            setBusyKey(`delete-${deleteTarget.id}`);
            try {
              await api.deleteConcert(token, deleteTarget.id);
              await refresh(token);
              showToast("Delete successfully");
              setDeleteTarget(null);
            } catch (error) {
              if (handleAuthError(error)) return;
              showToast(
                error instanceof ApiError
                  ? error.message
                  : error instanceof NetworkError
                    ? error.message
                    : "Unable to delete concert",
                "error",
              );
            } finally {
              setBusyKey(null);
            }
          }}
        />
      ) : null}

      <Toast
        toasts={toastMessages}
        onDismiss={(toastId) => {
          setToastMessages((currentToasts) =>
            currentToasts.filter((toast) => toast.id !== toastId),
          );
        }}
      />
    </>
  );
}
