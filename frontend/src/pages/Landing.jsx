import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Logo from "../components/Logo";
import { LEVELS } from "../utils/xp";
import styles from "./Landing.module.css";

export default function Landing() {
  const { displayName, setDisplayName, xpTotal, level, nextLevelInfo } = useApp();
  const [name, setName] = useState(displayName);
  const navigate = useNavigate();

  const isReturning = xpTotal > 0;

  function handleStart(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setDisplayName(trimmed);
    navigate("/setup");
  }

  const progressToNext = nextLevelInfo
    ? Math.min(100, Math.round(((xpTotal - level.minXp) / (nextLevelInfo.minXp - level.minXp)) * 100))
    : 100;

  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <header className={styles.header}>
        <Logo />
      </header>

      <main className={styles.hero}>
        <p className={styles.eyebrow}>AI-powered mock tests</p>
        <h1 className={styles.headline}>
          Harder than the real exam.
          <br />
          <span className={styles.headlineAccent}>So the real one feels easy.</span>
        </h1>
        <p className={styles.subhead}>
          Drop in your notes, a topic, or just the exam name — GATE, UGC-NET, JEE, GRE, UPSC,
          CSIR-NET, and more. PrepQuest builds a full mock paper and grades you like the real thing.
        </p>

        <form className={`card ${styles.formCard}`} onSubmit={handleStart}>
          <label className={styles.label} htmlFor="displayName">
            {isReturning ? "Welcome back — confirm your name" : "What should we call you?"}
          </label>
          <input
            id="displayName"
            className={styles.input}
            type="text"
            placeholder="e.g. Alex Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoFocus
          />

          {isReturning && (
            <div className={styles.progress}>
              <div className={styles.progressTop}>
                <span className={styles.levelLabel}>{level.label}</span>
                <span className={`mono ${styles.xpLabel}`}>{xpTotal} XP</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progressToNext}%` }} />
              </div>
              <span className={styles.progressHint}>
                {nextLevelInfo
                  ? `${nextLevelInfo.minXp - xpTotal} XP to ${nextLevelInfo.label}`
                  : "Max level reached — legendary."}
              </span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={!name.trim()} style={{ marginTop: 8 }}>
            Start a new test
          </button>
        </form>

        {!isReturning && (
          <div className={styles.levelPreview}>
            {LEVELS.map((l) => (
              <span key={l.label} className={styles.levelChip}>
                {l.label}
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
