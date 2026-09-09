"""
All prompt text sent to Gemini is assembled here, so the wording lives in
one place and gemini_service.py stays focused on the API call itself.
"""

from schemas import DifficultyLevel

_DIFFICULTY_INSTRUCTIONS: dict[DifficultyLevel, str] = {
    "same": "Match the typical difficulty of {exam_name}'s actual paper.",
    "harder": (
        "Make these questions one clear notch harder than {exam_name}'s actual "
        "difficulty — deeper conceptual twists, less formulaic."
    ),
    "much_harder": (
        "Make these questions significantly harder than {exam_name}'s actual "
        "difficulty — combine multiple concepts per question, include tricky "
        "edge cases and non-obvious traps in the distractors."
    ),
}


def difficulty_instruction(difficulty: DifficultyLevel, exam_name: str) -> str:
    template = _DIFFICULTY_INSTRUCTIONS[difficulty]
    return template.format(exam_name=exam_name)


def build_generation_instructions(
    exam_name: str,
    difficulty: DifficultyLevel,
    num_questions: int,
    topic_name: str | None,
    has_uploaded_content: bool,
) -> str:
    """Build the final instruction text sent alongside any content parts.

    This is deliberately the *last* part in the `contents` list passed to
    Gemini so it reads as the task description after any reference material.
    """

    topic_line = ""
    if topic_name:
        topic_line = (
            f"\nThe user also specified this topic/exam reference to focus on: "
            f"\"{topic_name}\"."
        )

    source_line = (
        "Use the study content / reference material supplied above as the "
        "primary source for question content."
        if has_uploaded_content
        else "No study notes were supplied — generate questions purely from "
        "your own knowledge of the exam's syllabus and typical question style."
    )

    return f"""
You are an expert exam-paper setter creating a mock test for the exam: "{exam_name}".

Calibrate the syllabus emphasis, question style, phrasing conventions, and
typical topic weightage to what is standard for "{exam_name}". {source_line}
{topic_line}

DIFFICULTY:
{difficulty_instruction(difficulty, exam_name)}

QUESTION FORMAT (strict):
- Generate exactly {num_questions} multiple-choice questions, each with a
  single correct answer and exactly 4 plausible options.
- Never use "all of the above" or "none of the above" as an option — every
  distractor must be a real, individually plausible wrong answer that
  reflects a specific misconception or common calculation slip.
- Do not produce duplicate or near-duplicate questions; each question must
  test a distinct idea or angle.
- Assign each question either 1 or 2 marks based on its complexity
  (2 marks for multi-step / higher-order questions, 1 mark for direct
  single-concept questions), and set negative_marks to marks / 3, rounded
  to 2 decimal places (e.g. 1 mark -> 0.33, 2 marks -> 0.67).
- For every question, write a full multi-step step_by_step_solution — an
  actual worked derivation or line of reasoning, clear enough to teach the
  concept to a student seeing it for the first time. Never just state
  "the answer is B" with no explanation.
- Give each question a short topic_tag (e.g. "Thermodynamics — First Law").
- Set total_questions to {num_questions} and total_marks to the sum of all
  question marks.
- Write a 1-2 sentence topic_summary describing what the test as a whole
  covers, and set difficulty_level to a short label matching the requested
  difficulty ("Same as actual exam", "Harder", or "Much Harder").

Strictly adhere to the provided JSON schema. Return only the structured
data — no extra commentary.
""".strip()


MAX_PASTED_TEXT_CHARS = 50_000
