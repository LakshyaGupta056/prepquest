import styles from "./QuestionPalette.module.css";

const STATUS_LABEL = {
  not_visited: "Not visited",
  visited_unanswered: "Not answered",
  answered: "Answered",
  marked_unanswered: "Marked for review",
  marked_answered: "Answered & marked",
};

function cellClass(status) {
  switch (status) {
    case "answered":
      return styles.answered;
    case "visited_unanswered":
      return styles.visitedUnanswered;
    case "marked_unanswered":
      return styles.marked;
    case "marked_answered":
      return styles.markedAnswered;
    default:
      return styles.notVisited;
  }
}

export default function QuestionPalette({
  questionNumbers,
  statusMap,
  currentQuestionNumber,
  onNavigate,
  onSubmit,
}) {
  const counts = questionNumbers.reduce(
    (acc, n) => {
      const status = statusMap[n] || "not_visited";
      if (status === "answered" || status === "marked_answered") acc.answered += 1;
      else if (status === "marked_unanswered") acc.marked += 1;
      else if (status === "visited_unanswered") acc.unanswered += 1;
      else acc.notVisited += 1;
      return acc;
    },
    { answered: 0, unanswered: 0, marked: 0, notVisited: 0 }
  );

  return (
    <aside className={styles.palette} aria-label="Question palette">
      <div className={styles.grid}>
        {questionNumbers.map((n) => {
          const status = statusMap[n] || "not_visited";
          const isCurrent = n === currentQuestionNumber;
          return (
            <button
              key={n}
              type="button"
              className={`${styles.cell} ${cellClass(status)} ${isCurrent ? styles.current : ""}`}
              onClick={() => onNavigate(n)}
              aria-current={isCurrent ? "true" : undefined}
              aria-label={`Question ${n}, ${STATUS_LABEL[status]}`}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div className={styles.legend}>
        <LegendItem swatchClass={styles.notVisited} label="Not visited" />
        <LegendItem swatchClass={styles.visitedUnanswered} label="Not answered" />
        <LegendItem swatchClass={styles.answered} label="Answered" />
        <LegendItem swatchClass={styles.marked} label="Marked for review" />
        <LegendItem swatchClass={styles.markedAnswered} label="Answered & marked" />
      </div>

      <div className={styles.summary}>
        <SummaryRow label="Answered" value={counts.answered} />
        <SummaryRow label="Not answered" value={counts.unanswered} />
        <SummaryRow label="Marked for review" value={counts.marked} />
        <SummaryRow label="Not visited" value={counts.notVisited} />
      </div>

      <button type="button" className="btn btn-primary" onClick={onSubmit} style={{ width: "100%" }}>
        Submit test
      </button>
    </aside>
  );
}

function LegendItem({ swatchClass, label }) {
  return (
    <div className={styles.legendItem}>
      <span className={`${styles.legendSwatch} ${swatchClass}`} />
      {label}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className={styles.summaryRow}>
      <span>{label}</span>
      <span className="mono">{value}</span>
    </div>
  );
}
