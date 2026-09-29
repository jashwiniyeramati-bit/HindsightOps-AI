// =========================================================
// HINDSIGHT API CLIENT
// Frontend ↔ FastAPI communication layer
// =========================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

// ---------------------------------------------------------
// Generic request helper
// ---------------------------------------------------------

async function request(endpoint, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    }
  );

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData?.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// =========================================================
// INCIDENTS
// =========================================================

export async function getIncidents() {
  return request("/incidents");
}

export async function getIncident(id) {
  return request(
    `/incidents/${encodeURIComponent(id)}`
  );
}

// =========================================================
// AI ANALYSIS
// =========================================================

export async function getAIAnalysis(id) {
  return request(
    `/incidents/${encodeURIComponent(id)}/analysis`
  );
}

// =========================================================
// HINDSIGHT MEMORY
// =========================================================

export async function getHistoricalMemories(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  const query = searchParams.toString();

  return request(
    `/memories${query ? `?${query}` : ""}`
  );
}

// =========================================================
// ENGINEER FEEDBACK
// =========================================================

export async function submitEngineerFeedback(data) {
  return request("/feedback", {
    method: "POST",
    body: JSON.stringify({
      incident_id: data.incident_id,
      decision: data.decision,
      outcome: data.outcome,
      comment: data.comment || "",
      recommendation: data.recommendation || "",
      service: data.service || "",
    }),
  });
}

// =========================================================
// LEARNING TIMELINE
// =========================================================

export async function getLearningTimeline() {
  return request("/learning");
}

// =========================================================
// HEALTH CHECK
// =========================================================

export async function checkBackendHealth() {
  return request("/health");
}

// =========================================================
// API CONFIG
// =========================================================

export { API_BASE_URL };