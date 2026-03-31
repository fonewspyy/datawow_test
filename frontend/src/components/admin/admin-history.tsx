"use client";

import { useEffect, useState } from "react";
import { HistoryTable } from "@/components/history-table";
import { Toast, type ToastMessage } from "@/components/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { api, ApiError } from "@/lib/api";
import type { HistoryRecord } from "@/lib/types";

export function AdminHistory() {
  const { token } = useAuth();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void (async () => {
      try {
        setHistory(await api.allHistory(token));
      } catch (error) {
        setToastMessages([
          {
            id: Date.now(),
            message: error instanceof ApiError ? error.message : "Unable to load history",
            tone: "error",
          },
        ]);
      }
    })();
  }, [token]);

  return (
    <>
      <HistoryTable history={history} includeUser />
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