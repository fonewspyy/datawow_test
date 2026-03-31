"use client";

import { useEffect, useState } from "react";
import { ConcertCard } from "@/components/concert-card";
import { Toast, type ToastMessage } from "@/components/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { api, ApiError } from "@/lib/api";
import type { ConcertItem } from "@/lib/types";

export function UserDashboard() {
  const { token } = useAuth();
  const [concerts, setConcerts] = useState<ConcertItem[]>([]);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const [busyConcertId, setBusyConcertId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    void refresh(token);
  }, [token]);

  async function refresh(currentToken: string) {
    setConcerts(await api.concerts(currentToken));
  }

  function pushToast(message: string, tone: ToastMessage["tone"] = "success") {
    setToastMessages((currentToasts) => [
      ...currentToasts,
      { id: Date.now(), message, tone },
    ]);
  }

  return (
    <>
      <section className="content-card">
        <div className="concert-list">
          {concerts.map((concert) => (
            <ConcertCard
              key={concert.id}
              concert={concert}
              mode="user"
              isBusy={busyConcertId === concert.id}
              onReserve={async (concertId) => {
                if (!token) {
                  return;
                }

                setBusyConcertId(concertId);
                try {
                  await api.reserve(token, concertId);
                  await refresh(token);
                  pushToast("Reserve successfully");
                } catch (error) {
                  pushToast(
                    error instanceof ApiError ? error.message : "Unable to reserve seat",
                    "error",
                  );
                } finally {
                  setBusyConcertId(null);
                }
              }}
              onCancel={async (concertId) => {
                if (!token) {
                  return;
                }

                setBusyConcertId(concertId);
                try {
                  await api.cancel(token, concertId);
                  await refresh(token);
                  pushToast("Cancel successfully");
                } catch (error) {
                  pushToast(
                    error instanceof ApiError ? error.message : "Unable to cancel reservation",
                    "error",
                  );
                } finally {
                  setBusyConcertId(null);
                }
              }}
            />
          ))}
        </div>
      </section>
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