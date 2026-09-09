import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getDisplayName, getXpTotal, setDisplayName as persistName, setXpTotal as persistXp } from "../utils/storage";
import { levelForXp, nextLevel } from "../utils/xp";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [displayName, setDisplayNameState] = useState(() => getDisplayName());
  const [xpTotal, setXpTotalState] = useState(() => getXpTotal());

  // testConfig: { examName, difficulty, numQuestions, timerEnabled, secondsPerQuestion }
  const [testConfig, setTestConfig] = useState(null);
  // testPaper: the MCQTestPaper returned by the backend, held only in memory
  const [testPaper, setTestPaper] = useState(null);
  // testResult: computed client-side after submission
  const [testResult, setTestResult] = useState(null);

  const updateDisplayName = useCallback((name) => {
    setDisplayNameState(name);
    persistName(name);
  }, []);

  const addXp = useCallback((amount) => {
    setXpTotalState((prev) => {
      const next = prev + amount;
      persistXp(next);
      return next;
    });
  }, []);

  const resetTestSession = useCallback(() => {
    setTestConfig(null);
    setTestPaper(null);
    setTestResult(null);
  }, []);

  const value = useMemo(
    () => ({
      displayName,
      setDisplayName: updateDisplayName,
      xpTotal,
      level: levelForXp(xpTotal),
      nextLevelInfo: nextLevel(xpTotal),
      addXp,
      testConfig,
      setTestConfig,
      testPaper,
      setTestPaper,
      testResult,
      setTestResult,
      resetTestSession,
    }),
    [displayName, xpTotal, addXp, testConfig, testPaper, testResult, resetTestSession, updateDisplayName]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
