/**
 * Grade a completed attempt entirely client-side. There is no backend
 * persistence layer — the test paper (including correct answers) already
 * lives in memory on the frontend for this session, per the app's
 * stateless design.
 */
export function gradeTest(testPaper, answers, elapsedSeconds) {
  let scoreObtained = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;

  const perQuestion = testPaper.questions.map((q) => {
    const selectedIndex = answers[q.question_number];
    const isAttempted = selectedIndex !== undefined;
    const isCorrect = isAttempted && selectedIndex === q.correct_option_index;

    let marksAwarded = 0;
    if (isAttempted && isCorrect) {
      marksAwarded = q.marks;
      correctCount += 1;
    } else if (isAttempted && !isCorrect) {
      marksAwarded = -q.negative_marks;
      wrongCount += 1;
    } else {
      unattemptedCount += 1;
    }

    scoreObtained += marksAwarded;

    return {
      ...q,
      selectedIndex,
      isAttempted,
      isCorrect,
      marksAwarded,
    };
  });

  const totalMarksPossible = testPaper.questions.reduce((sum, q) => sum + q.marks, 0);
  const attemptedCount = correctCount + wrongCount;
  const accuracyPct = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

  return {
    examName: testPaper.exam_name,
    difficultyLevel: testPaper.difficulty_level,
    totalMarksPossible,
    scoreObtained: Math.round(scoreObtained * 100) / 100,
    correctCount,
    wrongCount,
    unattemptedCount,
    numQuestions: testPaper.questions.length,
    accuracyPct,
    elapsedSeconds,
    perQuestion,
  };
}
