import { motion } from "framer-motion";
import styles from "./Badge.module.css";

export default function Badge({ emoji, label, delay = 0 }) {
  return (
    <motion.div
      className={styles.badge}
      initial={{ opacity: 0, scale: 0.6, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className={styles.emoji} aria-hidden="true">
        {emoji}
      </span>
      <span className={styles.label}>{label}</span>
    </motion.div>
  );
}
