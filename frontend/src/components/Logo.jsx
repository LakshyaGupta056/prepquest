import styles from "./Logo.module.css";

export default function Logo({ size = "md" }) {
  return (
    <span className={`${styles.logo} ${size === "lg" ? styles.lg : ""}`}>
      <span className={styles.mark} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="1em" height="1em">
          <path
            d="M12 2 L21 7 L21 15 L12 22 L3 15 L3 7 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M8 12 L11 15 L16 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      Prep<span className={styles.accent}>Quest</span>
    </span>
  );
}
