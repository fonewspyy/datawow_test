import Image from "next/image";

interface DeleteModalProps {
  concertName: string;
  isBusy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteModal({
  concertName,
  isBusy,
  onCancel,
  onConfirm,
}: DeleteModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card font-ibm-plex-thai">
        <div className="flex justify-center">
          <Image src="/icons/modal-confirm-delete.png" alt="" width={72} height={72} />
        </div>
        <h3 className="modal-title">Are you sure to delete?</h3>
        <p className="modal-subtitle">&quot;{concertName}&quot;</p>
        <div className="modal-actions">
          <button className="base-button button-muted" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className="base-button button-modal-delete"
            disabled={isBusy}
            onClick={onConfirm}
            type="button"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}