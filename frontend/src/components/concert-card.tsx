import Image from "next/image";
import type { ConcertItem } from "@/lib/types";

interface ConcertCardProps {
  concert: ConcertItem;
  mode: "admin" | "user";
  isBusy?: boolean;
  onDelete?: (concert: ConcertItem) => void;
  onReserve?: (concertId: number) => void;
  onCancel?: (concertId: number) => void;
}

export function ConcertCard({
  concert,
  mode,
  isBusy,
  onDelete,
  onReserve,
  onCancel,
}: ConcertCardProps) {
  const isReserved = concert.userReservationStatus === "RESERVED";

  return (
    <article className={`concert-card${concert.isSoldOut && mode === "user" && !isReserved ? " is-sold-out" : ""}`}>
      <div className="concert-header">
        <h2 className="concert-title">{concert.name}</h2>
        {concert.isSoldOut && mode === "user" && !isReserved && (
          <span className="sold-out-badge">Sold out</span>
        )}
      </div>
      <hr className="mt-5" />
      <p className="concert-description">{concert.description}</p>
      <div className="concert-footer">
        <div className="seat-meta">
          <Image src="/icons/icon-user.png" alt="" width={28} height={28} />
          <span>{concert.totalSeats.toLocaleString()}</span>
        </div>

        {mode === "admin" ? (
          <button
            className="base-button button-danger"
            disabled={isBusy}
            onClick={() => onDelete?.(concert)}
            type="button"
          >
            <Image src="/icons/btn-trash.png" alt="" width={20} height={20} />
            Delete
          </button>
        ) : isReserved ? (
          <button
            className="base-button button-soft-danger"
            disabled={isBusy}
            onClick={() => onCancel?.(concert.id)}
            type="button"
          >
            Cancel
          </button>
        ) : (
          <button
            className="base-button button-primary"
            disabled={isBusy || concert.isSoldOut}
            onClick={() => onReserve?.(concert.id)}
            type="button"
          >
            {concert.isSoldOut ? "Sold out" : "Reserve"}
          </button>
        )}
      </div>
    </article>
  );
}