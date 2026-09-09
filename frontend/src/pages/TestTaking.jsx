import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Logo from "../components/Logo";
import Timer from "../components/Timer";
import QuestionCountdown from "../components/QuestionCountdown";
import QuestionPalette from "../components/QuestionPalette";
import OptionCard from "../components/OptionCard";
import ConfirmModal from "../components/ConfirmModal";
import { gradeTest } from "../utils/grading";
import styles from "./TestTaking.module.css";

function getStatus(qn, visited, answers, marked) {
  const isVisited = visited.has(qn);
  const isAnswered = answers[qn] !== undefined;
  const isMarked = marked.has(qn);
  if (!isVisited) return "not_visited";
  if (isMarked && isAnswered) return "marked_answered";
  if (isMarked) return "marked_unanswered";
  if (isAnswered) return "answered";
  return "visited_unanswered";
}

export default function TestTaking() {
  const { testPaper, testConfig, setTestResult } = useApp();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState(() => new Set());
  const [visited, setVisited] = useState(() => new Set());
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const hasSubmittedRef = useRef(false);
  const elapsedRef = useRef(0);

  // Redirect if this page is reached without an in-memory test paper
  // (e.g. a direct URL visit or a hard refresh, which loses session state).
  useEffect(() => {
    if (!testPaper) {
      navigate("/setup", { replace: true });
    }
  }, [testPaper, navigate]);

  const questions = testPaper?.questions ?? [];
  const currentQuestion = questions[currentIndex];

  // Mark the current question visited whenever we land on it.
  useEffect(() => {
    if (!currentQuestion) return;
    setVisited((prev) => {
      if (prev.has(currentQuestion.question_number)) return prev;
      const next = new Set(prev);
      next.add(currentQuestion.question_number);
      return next;
    });
  }, [currentQuestion]);

  // Warn on browser refresh / tab close mid-test.
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (hasSubmittedRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Warn on in-app navigation away from an in-progress test.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !hasSubmittedRef.current && currentLocation.pathname !== nextLocation.pathname
  );

  const statusMap = useMemo(() => {
    const map = {};
    for (const q of questions) {
      map[q.question_number] = getStatus(q.question_number, visited, answers, marked);
    }
    return map;
  }, [questions, visited, answers, marked]);

  const questionNumbers = useMemo(() => questions.map((q) => q.question_number), [questions]);
  const attemptedCount = Object.keys(answers).length;

  if (!testPaper || !currentQuestion) return null;

  function goTo(index) {
    setCurrentIndex(Math.min(Math.max(index, 0), questions.length - 1));
  }

  function goToQuestionNumber(qn) {
    const idx = questions.findIndex((q) => q.question_number === qn);
    if (idx !== -1) goTo(idx);
  }

  function selectOption(optionIndex) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.question_number]: optionIndex }));
  }

  function clearResponse() {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.question_number];
      return next;
    });
  }

  function toggleMarkAndNext() {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.question_number)) next.delete(currentQuestion.question_number);
      else next.add(currentQuestion.question_number);
      return next;
    });
    goTo(currentIndex + 1);
  }

  function handleSubmit() {
    hasSubmittedRef.current = true;
    const result = gradeTest(testPaper, answers, elapsedRef.current);
    setTestResult({ ...result, timerEnabled: testConfig?.timerEnabled ?? false });
    navigate("/results");
  }

  const counts = questionNumbers.reduce(
    (acc, n) => {
      const status = statusMap[n];
      if (status === "answered" || status === "marked_answered") acc.answered += 1;
      else if (status === "marked_unanswered") acc.marked += 1;
      else if (status === "visited_unanswered") acc.unanswered += 1;
      else acc.notVisited += 1;
      return acc;
    },
    { answered: 0, unanswered: 0, marked: 0, notVisited: 0 }
  );

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <Logo />
          <span className={styles.examName}>{testConfig?.examName}</span>
        </div>
        <div className={styles.topbarRight}>
          <span className={styles.attempted}>
            <span className="mono">{attemptedCount}</span> / {questions.length} attempted
          </span>
          {testConfig?.timerEnabled && (
            <QuestionCountdown
              secondsPerQuestion={testConfig.secondsPerQuestion}
              questionKey={currentQuestion.question_number}
            />
          )}
          <Timer onTick={(s) => (elapsedRef.current = s)} />
        </div>
      </header>

      <div className={`container ${styles.layout}`}>
        <main className={styles.main}>
          <div className={`card ${styles.questionCard}`}>
            <div className={styles.questionMeta}>
              <span className={styles.questionNumber}>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className={styles.marksTag}>
                +{currentQuestion.marks} / -{currentQuestion.negative_marks}
              </span>
            </div>

            <p className={styles.questionText}>{currentQuestion.question_text}</p>

            <div className={styles.options}>
              {currentQuestion.options.map((opt, i) => (
                <OptionCard
                  key={i}
                  index={i}
                  text={opt}
                  selected={answers[currentQuestion.question_number] === i}
                  onClick={() => selectOption(i)}
                />
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn btn-ghost" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
              ← Previous
            </button>
            <div className={styles.actionsRight}>
              <button type="button" className="btn btn-ghost" onClick={clearResponse}>
                Clear response
              </button>
              <button type="button" className="btn btn-ghost" onClick={toggleMarkAndNext}>
                {marked.has(currentQuestion.question_number) ? "Unmark & next" : "Mark for review & next"}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => goTo(currentIndex + 1)} disabled={currentIndex === questions.length - 1}>
                Save & next →
              </button>
            </div>
          </div>
        </main>

        <QuestionPalette
          questionNumbers={questionNumbers}
          statusMap={statusMap}
          currentQuestionNumber={currentQuestion.question_number}
          onNavigate={goToQuestionNumber}
          onSubmit={() => setConfirmSubmitOpen(true)}
        />
      </div>

      <ConfirmModal
        open={confirmSubmitOpen}
        title="Submit your test?"
        confirmLabel="Submit"
        onCancel={() => setConfirmSubmitOpen(false)}
        onConfirm={handleSubmit}
      >
        <div className={styles.confirmCounts}>
          <span>✅ Answered: <strong>{counts.answered}</strong></span>
          <span>⭕ Not answered: <strong>{counts.unanswered}</strong></span>
          <span>🔖 Marked for review: <strong>{counts.marked}</strong></span>
          <span>⬜ Not visited: <strong>{counts.notVisited}</strong></span>
        </div>
        Once submitted, you'll see your score and full solutions — this can't be undone.
      </ConfirmModal>

      <ConfirmModal
        open={blocker.state === "blocked"}
        title="Leave this test?"
        confirmLabel="Leave test"
        cancelLabel="Stay"
        variant="danger"
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      >
        Your progress hasn't been submitted yet and will be lost if you leave now.
      </ConfirmModal>
    </div>
  );
}
