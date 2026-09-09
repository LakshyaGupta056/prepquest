import { useEffect, useRef, useState } from "react";
import styles from "./Timer.module.css";

function formatHMS(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Counts up from the moment it mounts. Reports elapsed seconds to the
 * parent on every tick via onTick, so the parent can read the latest
 * value (e.g. at submit time) without this component re-rendering the
 * whole page tree.
 */
export default function Timer({ onTick }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(seconds);
      onTick?.(seconds);
    }, 1000);
    return () => clearInterval(interval);
  }, [onTick]);

  return (
    <div className={styles.timer} role="timer" aria-label="Elapsed time">
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7 V12 L15.5 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span className={`${styles.value} mono`}>{formatHMS(elapsed)}</span>
    </div>
  );
}
