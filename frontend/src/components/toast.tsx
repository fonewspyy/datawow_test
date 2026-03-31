import Image from "next/image";

export interface ToastMessage {
  id: number;
  message: string;
  tone?: "success" | "error";
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="toast-stack font-ibm-plex-thai">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-card ${toast.tone === "error" ? "is-error" : ""}`}
        >
          <Image
            src={toast.tone === "error" ? "/icons/modal-confirm-delete.png" : "/icons/toast-success.png"}
            alt=""
            width={24}
            height={24}
          />
          <p className="toast-copy">{toast.message}</p>
          <button
            aria-label="Dismiss toast"
            className="toast-close"
            onClick={() => onDismiss(toast.id)}
            title="Dismiss toast"
            type="button"
          >
            <Image src="/icons/toast-close.png" alt="Close toast" width={14} height={14} />
          </button>
        </div>
      ))}
    </div>
  );
}