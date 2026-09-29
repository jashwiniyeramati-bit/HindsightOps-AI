import { useState } from "react";
import "./EngineerFeedback.css";
import { submitEngineerFeedback } from "./api";

function EngineerFeedback({
  incidentId,
  onBack,
  onLearning,
}) {
  const [decision, setDecision] = useState("");
  const [outcome, setOutcome] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveResult, setSaveResult] = useState(null);

  const incidents = {
    "INC-104": {
      service: "Payment API",
      error: "MongoServerSelectionTimeoutError",
      errorRate: "38.7%",
      priority: "P1 Critical",
      recommendation:
        "Roll back the recent network configuration",
      explanation:
        "Hindsight found a 92% similarity with previous incidents where a network configuration rollback resolved the database connectivity problem.",
    },

    "INC-103": {
      service: "Auth Service",
      error: "AuthenticationFailureRateExceeded",
      errorRate: "27.4%",
      priority: "P2 High",
      recommendation:
        "Roll back the latest authentication configuration",
      explanation:
        "Hindsight identified previous authentication incidents where configuration changes caused a sudden increase in failed login requests.",
    },

    "INC-102": {
      service: "Cache Service",
      error: "RedisMemoryLimitExceeded",
      errorRate: "31.2%",
      priority: "P2 High",
      recommendation:
        "Scale the cache service and clear stale cache entries",
      explanation:
        "Historical incidents indicate that clearing stale entries and increasing memory allocation resolved similar cache memory failures.",
    },
  };

  const currentIncidentId = incidentId || "INC-104";

  const incident =
    incidents[currentIncidentId] ||
    incidents["INC-104"];

  const handleSubmit = async () => {
    if (!decision || !outcome) {
      alert(
        "Please select an engineer decision and actual outcome."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      /*
       * This is the actual backend payload.
       *
       * api.js converts this into:
       * POST /feedback
       */
      const result = await submitEngineerFeedback({
        incident_id: currentIncidentId,
        decision,
        outcome,
        comment,
        service: incident.service,
        recommendation: incident.recommendation,
      });

      setSaveResult(result);
      setSubmitted(true);

      /*
       * Keep the existing parent callback if the parent
       * wants to update/navigate its own UI.
       */
      if (onLearning) {
        onLearning({
          decision,
          outcome,
          comment,
          incidentId: currentIncidentId,
          service: incident.service,
          recommendation: incident.recommendation,
          backendResult: result,
        });
      }
    } catch (err) {
      console.error("Failed to save engineer feedback:", err);

      setError(
        err?.message ||
          "Failed to save feedback. Please make sure the backend is running."
      );
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    const hindsightRetained =
      saveResult?.hindsight_retained === true ||
      saveResult?.memory?.status === "ok";

    return (
      <div className="feedback-page">
        <div className="feedback-success">
          <div className="success-icon">
            ✓
          </div>

          <h1>
            Feedback Recorded
          </h1>

          <p>
            Engineer feedback has been captured and
            the incident outcome has been sent to
            the backend learning loop.
          </p>

          <div className="learning-update">
            <div className="learning-icon">
              🧠
            </div>

            <div>
              <strong>
                {hindsightRetained
                  ? "Hindsight Memory Updated"
                  : "Learning Record Saved"}
              </strong>

              <span>
                {hindsightRetained
                  ? `${currentIncidentId} has been retained in Hindsight for future incident investigations.`
                  : `${currentIncidentId} was saved, but live Hindsight retention was not confirmed.`}
              </span>
            </div>
          </div>

          {!hindsightRetained && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                borderRadius: "8px",
                background: "#fff3cd",
                color: "#664d03",
              }}
            >
              Hindsight retention was not confirmed.
              Check the backend `/health` endpoint and
              Hindsight service before the demo.
            </div>
          )}

          <div className="success-actions">
            <button
              className="secondary-action"
              onClick={onBack}
            >
              ← Back to AI Analysis
            </button>

            <button
              className="primary-action"
              onClick={() => {
                if (onLearning) {
                  onLearning({
                    decision,
                    outcome,
                    comment,
                    incidentId: currentIncidentId,
                    service: incident.service,
                    recommendation:
                      incident.recommendation,
                    backendResult: saveResult,
                  });
                }
              }}
            >
              View Hindsight Learning →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-page">
      <div className="feedback-header">
        <button
          className="back-btn"
          onClick={onBack}
          disabled={saving}
        >
          ← Back to AI Analysis
        </button>

        <div>
          <h1>
            Engineer Feedback
          </h1>

          <p>
            Review the AI recommendation and record
            the actual incident outcome.
          </p>
        </div>
      </div>

      <section className="feedback-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">
              INCIDENT
            </span>

            <h2>
              {currentIncidentId} —{" "}
              {incident.service}
            </h2>
          </div>

          <span className="p1-badge">
            {incident.priority}
          </span>
        </div>

        <div className="incident-summary">
          <div>
            <span>
              Service
            </span>

            <strong>
              {incident.service}
            </strong>
          </div>

          <div>
            <span>
              Error
            </span>

            <strong>
              {incident.error}
            </strong>
          </div>

          <div>
            <span>
              Error Rate
            </span>

            <strong>
              {incident.errorRate}
            </strong>
          </div>
        </div>
      </section>

      <section className="feedback-card">
        <span className="eyebrow">
          AI RECOMMENDATION
        </span>

        <div className="recommendation-box">
          <div className="recommendation-icon">
            ✦
          </div>

          <div>
            <h3>
              {incident.recommendation}
            </h3>

            <p>
              {incident.explanation}
            </p>
          </div>

          <div className="confidence-box">
            <strong>
              {currentIncidentId === "INC-104"
                ? "92%"
                : currentIncidentId === "INC-103"
                ? "88%"
                : "84%"}
            </strong>

            <span>
              confidence
            </span>
          </div>
        </div>
      </section>

      <section className="feedback-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">
              STEP 1
            </span>

            <h2>
              What was your decision?
            </h2>

            <p className="card-description">
              Record whether the engineer followed
              the AI recommendation.
            </p>
          </div>
        </div>

        <div className="choice-grid">
          <button
            className={
              decision === "accepted"
                ? "choice-btn selected"
                : "choice-btn"
            }
            onClick={() =>
              setDecision("accepted")
            }
            disabled={saving}
          >
            <span className="choice-icon">
              ✓
            </span>

            <div>
              <strong>
                Accepted
              </strong>

              <span>
                Followed the AI recommendation
              </span>
            </div>
          </button>

          <button
            className={
              decision === "modified"
                ? "choice-btn selected"
                : "choice-btn"
            }
            onClick={() =>
              setDecision("modified")
            }
            disabled={saving}
          >
            <span className="choice-icon">
              ↗
            </span>

            <div>
              <strong>
                Modified
              </strong>

              <span>
                Used a modified approach
              </span>
            </div>
          </button>

          <button
            className={
              decision === "rejected"
                ? "choice-btn selected"
                : "choice-btn"
            }
            onClick={() =>
              setDecision("rejected")
            }
            disabled={saving}
          >
            <span className="choice-icon">
              ×
            </span>

            <div>
              <strong>
                Rejected
              </strong>

              <span>
                Did not follow the recommendation
              </span>
            </div>
          </button>
        </div>
      </section>

      <section className="feedback-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">
              STEP 2
            </span>

            <h2>
              What was the actual outcome?
            </h2>

            <p className="card-description">
              This outcome becomes part of Hindsight's
              future learning.
            </p>
          </div>
        </div>

        <div className="outcome-grid">
          <button
            className={
              outcome === "resolved"
                ? "outcome-btn selected"
                : "outcome-btn"
            }
            onClick={() =>
              setOutcome("resolved")
            }
            disabled={saving}
          >
            <span>
              ✓
            </span>

            <div>
              <strong>
                Resolved
              </strong>

              <small>
                Incident recovered successfully
              </small>
            </div>
          </button>

          <button
            className={
              outcome === "partial"
                ? "outcome-btn selected"
                : "outcome-btn"
            }
            onClick={() =>
              setOutcome("partial")
            }
            disabled={saving}
          >
            <span>
              ◐
            </span>

            <div>
              <strong>
                Partially Resolved
              </strong>

              <small>
                Some issues remained
              </small>
            </div>
          </button>

          <button
            className={
              outcome === "failed"
                ? "outcome-btn selected"
                : "outcome-btn"
            }
            onClick={() =>
              setOutcome("failed")
            }
            disabled={saving}
          >
            <span>
              ×
            </span>

            <div>
              <strong>
                Failed
              </strong>

              <small>
                Recommended action did not work
              </small>
            </div>
          </button>
        </div>
      </section>

      <section className="feedback-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">
              OPTIONAL
            </span>

            <h2>
              Engineer Notes
            </h2>

            <p className="card-description">
              Add context that could help future
              incident investigations.
            </p>
          </div>
        </div>

        <textarea
          className="feedback-textarea"
          value={comment}
          onChange={(e) =>
            setComment(e.target.value)
          }
          placeholder="Example: Rollback restored database connectivity within 2 minutes..."
          disabled={saving}
        />
      </section>

      <section className="learning-preview">
        <div className="preview-icon">
          🧠
        </div>

        <div>
          <span>
            HINDSIGHT LEARNING
          </span>

          <h3>
            This feedback will improve future
            recommendations
          </h3>

          <p>
            The incident, engineer decision, actual
            outcome, and notes will become historical
            context for similar incidents.
          </p>
        </div>
      </section>

      {error && (
        <div
          style={{
            marginTop: "16px",
            padding: "14px",
            borderRadius: "8px",
            background: "#f8d7da",
            color: "#842029",
          }}
        >
          <strong>
            Could not save feedback:
          </strong>{" "}
          {error}
        </div>
      )}

      <div className="submit-area">
        <button
          className="secondary-action"
          onClick={onBack}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          className="primary-action"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving
            ? "Saving to Hindsight..."
            : "Save Feedback & Update Hindsight →"}
        </button>
      </div>
    </div>
  );
}

export default EngineerFeedback;