import styles from "./OptionCard.module.css";

const LETTERS = ["A", "B", "C", "D"];

/**
 * variant:
 *  - "interactive" (default): clickable, shows selected state
 *  - "review": read-only, shows correct/incorrect/selected coloring
 */
export default function OptionCard({
  index,
  text,
  selected,
  onClick,
  variant = "interactive",
  isCorrectAnswer = false,
  isUserWrongAnswer = false,
}) {
  const classes = [styles.card];

  if (variant === "interactive") {
    if (selected) classes.push(styles.selected);
  } else {
    if (isCorrectAnswer) classes.push(styles.correct);
    if (isUserWrongAnswer) classes.push(styles.incorrect);
    if (!isCorrectAnswer && !isUserWrongAnswer) classes.push(styles.neutral);
  }

  return (
    <button
      type="button"
      className={classes.join(" ")}
      onClick={variant === "interactive" ? onClick : undefined}
      disabled={variant === "review"}
      aria-pressed={variant === "interactive" ? selected : undefined}
    >
      <span className={styles.letter}>{LETTERS[index]}</span>
      <span className={styles.text}>{text}</span>
      {variant === "review" && isCorrectAnswer && <span className={styles.badge}>Correct</span>}
      {variant === "review" && isUserWrongAnswer && <span className={styles.badge}>Your answer</span>}
    </button>
  );
}
