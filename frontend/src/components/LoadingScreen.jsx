import { useEffect, useState } from "react";
import styles from "./LoadingScreen.module.css";

const DEFAULT_MESSAGES = [
  "Summoning tricky questions…",
  "Calibrating difficulty…",
  "Sharpening distractors…",
  "Consulting the syllabus…",
  "Writing step-by-step solutions…",
  "Double-checking the answer key…",
];

export default function LoadingScreen({ messages = DEFAULT_MESSAGES }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.spinner}>
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path
            d="M12 2 L21 7 L21 15 L12 22 L3 15 L3 7 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p key={index} className={styles.message}>
        {messages[index]}
      </p>
      <div className={styles.bar}>
        <div className={styles.barFill} />
      </div>
    </div>
  );
}
