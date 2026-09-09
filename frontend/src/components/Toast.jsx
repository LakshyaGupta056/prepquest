import { useEffect } from "react";
import styles from "./Toast.module.css";

export default function Toast({ message, variant = "default", onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`${styles.toast} ${styles[variant] || ""}`} role="status">
      {message}
      <button type="button" className={styles.close} onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
