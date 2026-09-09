import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Logo from "../components/Logo";
import ScoreRing from "../components/ScoreRing";
import Badge from "../components/Badge";
import OptionCard from "../components/OptionCard";
import Toast from "../components/Toast";
import { computeXpEarned, computeBadges, estimatedFairSeconds } from "../utils/xp";
import { formatDuration } from "../utils/format";
import styles from "./Results.module.css";

export default function Results() {
  const { testResult, displayName, xpTotal, level, addXp, resetTestSession } = useApp();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(() => new Set());
  const [toastMessage, setToastMessage] = useState("");
  const xpAppliedRef = useRef(false);

  useEffect(() => {
    if (!testResult) {
      navigate("/setup", { replace: true });
    }
  }, [testResult, navigate]);

  useEffect(() => {
    if (!testResult || xpAppliedRef.current) return;
    xpAppliedRef.current = true;
    const xpEarned = computeXpEarned({
      correctCount: testResult.correctCount,
      accuracyPct: testResult.accuracyPct,
      elapsedSeconds: testResult.elapsedSeconds,
      numQuestions: testResult.numQuestions,
    });
    addXp(xpEarned);
    setToastMessage(`+${xpEarned} XP earned!`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testResult]);

  if (!testResult) return null;

  const fairSeconds = estimatedFairSeconds(testResult.numQuestions);
  const badges = computeBadges({
    accuracyPct: testResult.accuracyPct,
    elapsedSeconds: testResult.elapsedSeconds,
    numQuestions: testResult.numQuestions,
  });

  function toggleExpanded(qn) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(qn)) next.delete(qn);
      else next.add(qn);
      return next;
    });
  }

  function handleTakeAnother() {
    resetTestSession();
    navigate("/setup");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Logo />
          <button type="button" className="btn btn-primary" onClick={handleTakeAnother}>
            Take another test
          </button>
        </div>
      </header>

      <div className="container">
        <section className={styles.summarySection}>
          <ScoreRing scoreObtained={testResult.scoreObtained} totalMarks={testResult.totalMarksPossible} />

          <div className={styles.summaryText}>
            <p className={styles.congrats}>
              {displayName ? `Nice work, ${displayName}.` : "Nice work."}
            </p>
            <h1 className={styles.examLabel}>{testResult.examName}</h1>
            <p className={styles.levelLine}>
              <span className={styles.levelBadge}>{level.label}</span>
              <span className="mono">{xpTotal} XP total</span>
            </p>
          </div>
        </section>

        <section className={styles.statsRow}>
          <StatCard label="Accuracy" value={`${testResult.accuracyPct.toFixed(1)}%`} />
          <StatCard label="Correct" value={testResult.correctCount} tone="success" />
          <StatCard label="Wrong" value={testResult.wrongCount} tone="danger" />
          <StatCard label="Unattempted" value={testResult.unattemptedCount} />
          <StatCard label="Time taken" value={formatDuration(testResult.elapsedSeconds)} />
          <StatCard label="Fair time est." value={formatDuration(fairSeconds)} />
        </section>

        {badges.length > 0 && (
          <section className={styles.badgesRow}>
            {badges.map((b, i) => (
              <Badge key={b.id} emoji={b.emoji} label={b.label} delay={i * 0.08} />
            ))}
          </section>
        )}

        <section className={styles.review}>
          <h2 className={styles.reviewTitle}>Question-by-question review</h2>
          <div className={styles.reviewList}>
            {testResult.perQuestion.map((q, idx) => (
              <ReviewItem key={q.question_number} q={q} idx={idx} isOpen={expanded.has(q.question_number)} onToggle={() => toggleExpanded(q.question_number)} />
            ))}
          </div>
        </section>
      </div>

      <Toast message={toastMessage} variant="xp" onClose={() => setToastMessage("")} />
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className={`card ${styles.statCard} ${tone ? styles[`tone-${tone}`] : ""}`}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function ReviewItem({ q, idx, isOpen, onToggle }) {
  const resultTag = !q.isAttempted ? "Unattempted" : q.isCorrect ? "Correct" : "Incorrect";
  const tagClass = !q.isAttempted ? styles.tagNeutral : q.isCorrect ? styles.tagSuccess : styles.tagDanger;

  return (
    <div className={`card ${styles.reviewItem}`}>
      <button type="button" className={styles.reviewHeader} onClick={onToggle} aria-expanded={isOpen}>
        <span className={styles.reviewHeaderLeft}>
          <span className={styles.reviewIndex}>Q{idx + 1}</span>
          <span className={styles.reviewTopic}>{q.topic_tag}</span>
        </span>
        <span className={styles.reviewHeaderRight}>
          <span className={`${styles.tag} ${tagClass}`}>{resultTag}</span>
          <span className={`mono ${styles.marksAwarded} ${q.marksAwarded >= 0 ? styles.marksPositive : styles.marksNegative}`}>
            {q.marksAwarded >= 0 ? "+" : ""}
            {q.marksAwarded.toFixed(2)}
          </span>
          <span className={styles.chevron}>{isOpen ? "▲" : "▼"}</span>
        </span>
      </button>

      {isOpen && (
        <div className={styles.reviewBody}>
          <p className={styles.reviewQuestionText}>{q.question_text}</p>
          <div className={styles.reviewOptions}>
            {q.options.map((opt, i) => (
              <OptionCard
                key={i}
                index={i}
                text={opt}
                variant="review"
                isCorrectAnswer={i === q.correct_option_index}
                isUserWrongAnswer={q.isAttempted && !q.isCorrect && i === q.selectedIndex}
              />
            ))}
          </div>
          <div className={styles.solution}>
            <h4 className={styles.solutionTitle}>Step-by-step solution</h4>
            <p className={styles.solutionText}>{q.step_by_step_solution}</p>
          </div>
        </div>
      )}
    </div>
  );
}
