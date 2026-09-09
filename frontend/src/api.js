const API_BASE = "/api";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * POST the test-setup form to the backend and return the generated
 * MCQTestPaper. Throws ApiError with a friendly message on any failure.
 */
export async function generateTest(formData) {
  let response;
  try {
    response = await fetch(`${API_BASE}/generate-test`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new ApiError(
      "Couldn't reach the server. Check your connection and try again.",
      0
    );
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // response wasn't JSON (e.g. a proxy error page) — fall through
  }

  if (!response.ok) {
    const message =
      body?.error ||
      body?.detail ||
      "Couldn't generate your test — try again in a moment.";
    throw new ApiError(message, response.status);
  }

  return body.test;
}

export async function checkHealth() {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new ApiError("Health check failed", response.status);
  return response.json();
}
