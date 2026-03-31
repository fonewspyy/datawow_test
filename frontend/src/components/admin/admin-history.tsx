"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HistoryTable } from "@/components/history-table";
import { Toast, type ToastMessage } from "@/components/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { api, ApiError, NetworkError } from "@/lib/api";
import type { HistoryRecord } from "@/lib/types";

export function AdminHistory() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadHistory(token);
  }, [token]);

  async function loadHistory(currentToken: string) {
    try {
      setFetchError(null);
      setHistory(await api.allHistory(currentToken));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        router.push("/login?next=/admin/history");
        return;
      }
      const msg = error instanceof NetworkError
        ? error.message
        : error instanceof ApiError
          ? error.message
          : "Unable to load history";
      setFetchError(msg);
      setToastMessages([
        { id: Date.now(), message: msg, tone: "error" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {isLoading ? (
        <p className="dashboard-loading">Loading history…</p>
      ) : fetchError ? (
        <div className="fetch-error-banner">
          <p>{fetchError}</p>
          <button className="base-button button-primary" onClick={() => { if (token) { setIsLoading(true); void loadHistory(token); } }} type="button">
            Retry
          </button>
        </div>
      ) : history.length === 0 ? (
        <p className="empty-state">No reservation history yet.</p>
      ) : (
        <HistoryTable history={history} includeUser />
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