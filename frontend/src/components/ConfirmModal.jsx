import { useEffect } from "react";
import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "primary",
}) {
  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(e) {
      if (e.key === "Escape") onCancel?.();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onCancel}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-modal-title" className={styles.title}>
          {title}
        </h3>
        <div className={styles.body}>{children}</div>
        <div className={styles.actions}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${variant === "danger" ? "btn-danger-ghost" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
