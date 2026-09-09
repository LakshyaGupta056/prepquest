import { useEffect, useRef, useState } from "react";
import styles from "./QuestionCountdown.module.css";

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function QuestionCountdown({ secondsPerQuestion, questionKey }) {
  const [remaining, setRemaining] = useState(secondsPerQuestion);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemaining(secondsPerQuestion);
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
    // Restart whenever the question changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionKey, secondsPerQuestion]);

  const fraction = secondsPerQuestion > 0 ? remaining / secondsPerQuestion : 0;
  const offset = CIRCUMFERENCE * (1 - fraction);
  const isWarning = remaining <= Math.min(10, secondsPerQuestion * 0.25) && remaining > 0;
  const isExpired = remaining === 0;

  return (
    <div
      className={`${styles.wrap} ${isWarning ? styles.warning : ""} ${isExpired ? styles.expired : ""}`}
      title={isExpired ? "Time's up for this question — take your time, nothing will auto-submit" : undefined}
    >
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={RADIUS} fill="none" stroke="var(--color-border)" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 24 24)"
          className={styles.ring}
        />
      </svg>
      <span className={`${styles.value} mono`}>{remaining}s</span>
    </div>
  );
}
