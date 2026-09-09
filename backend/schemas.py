"""
Pydantic models shared across the backend.

MCQQuestion / MCQTestPaper define the exact JSON shape we ask Gemini to
produce (via response_schema) and the shape the frontend consumes.
"""

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class MCQQuestion(BaseModel):
    question_number: int
    question_text: str
    options: List[str] = Field(description="Exactly 4 answer options")
    correct_option_index: int = Field(description="0-based index of the correct option")
    marks: float = Field(description="1 or 2, based on question complexity")
    negative_marks: float = Field(description="marks divided by 3, rounded to 2 decimals")
    topic_tag: str
    step_by_step_solution: str = Field(
        description="Full worked solution, multi-step, like a solution manual"
    )

    @field_validator("options")
    @classmethod
    def must_have_four_options(cls, v: List[str]) -> List[str]:
        if len(v) != 4:
            raise ValueError("Each question must have exactly 4 options")
        return v

    @field_validator("correct_option_index")
    @classmethod
    def index_in_range(cls, v: int) -> int:
        if not (0 <= v <= 3):
            raise ValueError("correct_option_index must be between 0 and 3")
        return v


class MCQTestPaper(BaseModel):
    exam_name: str
    topic_summary: str
    difficulty_level: str
    total_questions: int
    total_marks: float
    questions: List[MCQQuestion]


# ---------------------------------------------------------------------------
# API request / response models
# ---------------------------------------------------------------------------

DifficultyLevel = Literal["same", "harder", "much_harder"]


class GenerateTestResponse(BaseModel):
    """Successful /api/generate-test response body."""

    test: MCQTestPaper


class ErrorResponse(BaseModel):
    """Shape of any error body returned by the API."""

    error: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    status: str = "ok"
