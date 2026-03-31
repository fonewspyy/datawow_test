"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConcertCard } from "@/components/concert-card";
import { Toast, type ToastMessage } from "@/components/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { api, ApiError, NetworkError } from "@/lib/api";
import type { ConcertItem } from "@/lib/types";

export function UserDashboard() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [concerts, setConcerts] = useState<ConcertItem[]>([]);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const [busyConcertId, setBusyConcertId] = useState<number | null>(null);
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
      router.push("/login?next=/user");
      return true;
    }
    return false;
  }

  async function refresh(currentToken: string) {
    try {
      setFetchError(null);
      setConcerts(await api.concerts(currentToken));
    } catch (error) {
      if (handleAuthError(error)) return;
      const msg = error instanceof NetworkError
        ? error.message
        : error instanceof ApiError
          ? error.message
          : "Failed to load concerts. Please try again.";
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function pushToast(message: string, tone: ToastMessage["tone"] = "success") {
    setToastMessages((currentToasts) => [
      ...currentToasts,
      { id: Date.now(), message, tone },
    ]);
  }

  return (
    <>
      {isLoading ? (
        <p className="dashboard-loading">Loading concerts…</p>
      ) : fetchError ? (
        <div className="fetch-error-banner">
          <p>{fetchError}</p>
          <button className="base-button button-primary" onClick={() => { if (token) { setIsLoading(true); void refresh(token); } }} type="button">
            Retry
          </button>
        </div>
      ) : (
        <section className="content-section">
          <div className="concert-list">
            {concerts.length === 0 ? (
              <p className="empty-state">No concerts available at the moment.</p>
            ) : (
              concerts.map((concert) => (
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
                      pushToast("Reservation confirmed! Your seat has been secured.");
                    } catch (error) {
                      if (handleAuthError(error)) return;
                      pushToast(
                        error instanceof ApiError
                          ? error.message
                          : error instanceof NetworkError
                            ? error.message
                            : "Unable to complete reservation. Please try again.",
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
                      pushToast("Reservation cancelled. Your seat has been released.");
                    } catch (error) {
                      if (handleAuthError(error)) return;
                      pushToast(
                        error instanceof ApiError
                          ? error.message
                          : error instanceof NetworkError
                            ? error.message
                            : "Unable to cancel reservation. Please try again.",
                        "error",
                      );
                    } finally {
                      setBusyConcertId(null);
                    }
                  }}
                />
              ))
            )}
          </div>
        </section>
      )}
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
