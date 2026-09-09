// Simple, cosmetic-only progression system. None of this affects scoring.

export const LEVELS = [
  { label: "Rookie", minXp: 0 },
  { label: "Scholar", minXp: 500 },
  { label: "Ace", minXp: 1500 },
  { label: "Master", minXp: 3000 },
];

export function levelForXp(xpTotal) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xpTotal >= level.minXp) current = level;
  }
  return current;
}

export function nextLevel(xpTotal) {
  return LEVELS.find((level) => level.minXp > xpTotal) || null;
}

const FAIR_SECONDS_PER_QUESTION = 90; // ~1.5 min/question

export function estimatedFairSeconds(numQuestions) {
  return numQuestions * FAIR_SECONDS_PER_QUESTION;
}

/**
 * Compute XP earned for a single test attempt.
 * Base XP rewards correct answers; bonuses reward accuracy and pace.
 * Purely cosmetic — never shown live during a test.
 */
export function computeXpEarned({ correctCount, accuracyPct, elapsedSeconds, numQuestions }) {
  let xp = correctCount * 10;
  if (accuracyPct >= 90) xp += 50;
  else if (accuracyPct >= 75) xp += 20;

  const fair = estimatedFairSeconds(numQuestions);
  if (elapsedSeconds > 0 && elapsedSeconds < fair * 0.7) xp += 30;

  return Math.round(xp);
}

export function computeBadges({ accuracyPct, elapsedSeconds, numQuestions }) {
  const badges = [];
  const fair = estimatedFairSeconds(numQuestions);

  if (accuracyPct > 90) {
    badges.push({ id: "sharpshooter", emoji: "🎯", label: "Sharpshooter" });
  }
  if (elapsedSeconds > 0 && elapsedSeconds < fair * 0.7) {
    badges.push({ id: "fast-finisher", emoji: "⚡", label: "Fast Finisher" });
  }
  if (numQuestions >= 50) {
    badges.push({ id: "deep-diver", emoji: "🧠", label: "Deep Diver" });
  }

  return badges;
}
