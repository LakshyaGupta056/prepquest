import { useEffect, useRef, useState } from "react";
import styles from "./ScoreRing.module.css";

const RADIUS = 78;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TICK_COUNT = 24;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export default function ScoreRing({ scoreObtained, totalMarks, durationMs = 1000 }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  const clampedFraction = totalMarks > 0 ? Math.min(1, Math.max(0, scoreObtained / totalMarks)) : 0;

  useEffect(() => {
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(t);
      setProgress(eased * clampedFraction);
      setDisplayScore(eased * scoreObtained);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreObtained, clampedFraction, durationMs]);

  const offset = CIRCUMFERENCE * (1 - progress);
  const percentDisplay = totalMarks > 0 ? Math.round((scoreObtained / totalMarks) * 100) : 0;

  return (
    <div className={styles.wrap}>
      <svg width="200" height="200" viewBox="0 0 200 200" className={styles.svg}>
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {/* Dial ticks */}
        <g className={styles.ticks}>
          {Array.from({ length: TICK_COUNT }).map((_, i) => {
            const angle = (i / TICK_COUNT) * 360;
            return (
              <line
                key={i}
                x1="100"
                y1="10"
                x2="100"
                y2="18"
                transform={`rotate(${angle} 100 100)`}
                stroke="var(--color-border)"
                strokeWidth="2"
              />
            );
          })}
        </g>

        <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="var(--color-border-soft)" strokeWidth="12" />
        <circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
        />
      </svg>

      <div className={styles.center}>
        <span className={`${styles.score} mono`}>{displayScore.toFixed(1)}</span>
        <span className={styles.outOf}>/ {totalMarks} marks</span>
        <span className={styles.percent}>{percentDisplay}%</span>
      </div>
    </div>
  );
}
