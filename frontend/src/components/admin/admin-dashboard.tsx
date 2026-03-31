"use client";

import { useEffect, useState } from "react";
import { ConcertCard } from "@/components/concert-card";
import { CreateConcertForm } from "@/components/create-concert-form";
import { DeleteModal } from "@/components/delete-modal";
import { StatCard } from "@/components/stat-card";
import { TabSwitcher } from "@/components/tab-switcher";
import { Toast, type ToastMessage } from "@/components/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { api, ApiError, extractFieldErrors } from "@/lib/api";
import type { ConcertItem, DashboardStats } from "@/lib/types";

const defaultStats: DashboardStats = {
  totalSeats: 0,
  reservedSeats: 0,
  cancelledReservations: 0,
};

export function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [concerts, setConcerts] = useState<ConcertItem[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "create">("overview");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ConcertItem | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    void refresh(token);
  }, [token]);

  async function refresh(currentToken: string) {
    const [concertItems, dashboardStats] = await Promise.all([
      api.concerts(currentToken),
      api.stats(currentToken),
    ]);
    setConcerts(concertItems);
    setStats(dashboardStats);
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
        <section className="content-card">
          <div className="concert-list">
            {concerts.map((concert) => (
              <ConcertCard
                key={concert.id}
                concert={concert}
                mode="admin"
                isBusy={busyKey === `delete-${concert.id}`}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </section>
      ) : (
        <CreateConcertForm
          fieldErrors={fieldErrors}
          isSubmitting={busyKey === "create"}
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
              if (error instanceof ApiError) {
                setFieldErrors(extractFieldErrors(error));
                showToast(error.message, "error");
              }
              return false;
            } finally {
              setBusyKey(null);
            }
          }}
        />
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
              showToast(
                error instanceof ApiError ? error.message : "Unable to delete concert",
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