import { useState, useEffect } from "react";
import "./AIAnalysis.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

function AIAnalysis({
  incidentId,
  onBack,
  onFeedback,
}) {
  const [currentId, setCurrentId] = useState(
    incidentId || "INC-104"
  );

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // Keep selected incident synchronized with parent
  // ---------------------------------------------------------

  useEffect(() => {
    if (incidentId) {
      setCurrentId(incidentId);
    }
  }, [incidentId]);

  // ---------------------------------------------------------
  // Load AI analysis
  // ---------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadAnalysis() {
      if (!currentId) {
        return;
      }

      setLoading(true);
      setError("");
      setIncident(null);

      try {
        const endpoint =
          `${API_BASE_URL}/incidents/${encodeURIComponent(
            currentId
          )}/analysis`;

        console.log(
          "Loading AI analysis from:",
          endpoint
        );

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          let backendMessage = "";

          try {
            const errorData = await response.json();

            if (errorData?.detail) {
              backendMessage = errorData.detail;
            }
          } catch {
            // Backend may not have returned JSON.
          }

          throw new Error(
            backendMessage ||
              `Backend returned HTTP ${response.status}`
          );
        }

        const data = await response.json();

        console.log(
          "AI analysis response:",
          data
        );

        if (cancelled) {
          return;
        }

        // -----------------------------------------------------
        // Historical memories
        // -----------------------------------------------------

        const memories = Array.isArray(data.memories)
          ? data.memories.map((memory, index) => ({
              id:
                memory.id ||
                `Historical Incident ${index + 1}`,

              service:
                memory.service ||
                "Unknown Service",

              match:
                memory.match ||
                "—",

              description:
                memory.description ||
                memory.text ||
                "Historical incident recalled.",

              outcome:
                memory.outcome ||
                "Historical outcome available.",
            }))
          : [];

        // -----------------------------------------------------
        // Confidence
        // -----------------------------------------------------

        let confidenceValue = data.confidence;

        if (
          confidenceValue === null ||
          confidenceValue === undefined ||
          confidenceValue === ""
        ) {
          confidenceValue = "0%";
        }

        if (
          typeof confidenceValue === "number"
        ) {
          confidenceValue =
            `${confidenceValue}%`;
        }

        confidenceValue =
          String(confidenceValue);

        // -----------------------------------------------------
        // Possible root causes
        // -----------------------------------------------------

        let possibleRootCauses =
          Array.isArray(data.possible_root_causes)
            ? data.possible_root_causes
            : [];

        // Backend currently provides root_cause,
        // so include it when possible_root_causes
        // isn't present.

        if (
          possibleRootCauses.length === 0 &&
          data.root_cause
        ) {
          possibleRootCauses = [
            data.root_cause,
          ];
        }

        // -----------------------------------------------------
        // Historical count
        // -----------------------------------------------------

        const historicalCount =
          Array.isArray(
            data.memories_recalled_raw
          )
            ? data.memories_recalled_raw.length
            : memories.length;

        // -----------------------------------------------------
        // Build UI incident object
        // -----------------------------------------------------

        const normalizedIncident = {
          id:
            data.incident_id ||
            currentId,

          service:
            data.incident?.service ||
            "Unknown Service",

          error:
            data.incident?.error ||
            "Unknown Error",

          severity:
            data.incident?.severity ||
            "Unknown",

          detected:
            data.incident?.detected_at ||
            "Unknown",

          description:
            data.incident?.description ||
            "No incident description available.",

          deployment:
            data.incident?.deployment ||
            "",

          status:
            data.incident?.status ||
            "",

          memories,

          reasoning:
            data.reasoning ||
            "No reasoning information available.",

          recommendation:
            data.recommendation ||
            "Collect additional logs and metrics before taking corrective action.",

          recommendationReason:
            data.recommendation_reason ||
            "Generated from available incident evidence and historical analysis.",

          confidence:
            confidenceValue,

          possibleRootCauses,

          hindsightAvailable:
            data.hindsight_available === true,

          historicalCount,

          rootCause:
            data.root_cause ||
            "",
        };

        setIncident(
          normalizedIncident
        );
      } catch (err) {
        console.error(
          "Failed to load incident analysis:",
          err
        );

        if (!cancelled) {
          setError(
            `Unable to load analysis from the backend. ${
              err?.message ||
              "Please check that FastAPI is running."
            }`
          );

          setIncident(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [currentId]);

  // ---------------------------------------------------------
  // Incident selector
  // ---------------------------------------------------------

  const incidentOptions = [
    {
      id: "INC-104",
      label:
        "INC-104 (Payment API - MongoDB Timeout)",
    },
    {
      id: "INC-103",
      label:
        "INC-103 (Auth Service - Auth Failures)",
    },
    {
      id: "INC-102",
      label:
        "INC-102 (Cache Service - Redis Memory)",
    },
    {
      id: "INC-101",
      label:
        "INC-101 (Orders API - 502 Bad Gateway)",
    },
  ];

  // ---------------------------------------------------------
  // Confidence number for progress bar
  // ---------------------------------------------------------

  const confidenceNumber = incident
    ? Math.max(
        0,
        Math.min(
          100,
          parseInt(
            String(
              incident.confidence
            ).replace("%", ""),
            10
          ) || 0
        )
      )
    : 0;

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <main className="ai-analysis-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="analysis-header">

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >

          <button
            className="analysis-back"
            onClick={onBack}
            style={{
              marginBottom: 0,
            }}
          >
            ← Back to Incident Details
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >

            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#64748b",
              }}
            >
              Select Incident to Analyze:
            </span>

            <select
              value={currentId}
              onChange={(e) =>
                setCurrentId(
                  e.target.value
                )
              }
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border:
                  "1px solid #cbd5e1",
                background: "#ffffff",
                fontWeight: "600",
                fontSize: "13px",
                color: "#1e293b",
                cursor: "pointer",
                boxShadow:
                  "0 1px 2px 0 rgba(0,0,0,0.05)",
              }}
            >

              {incidentOptions.map(
                (option) => (
                  <option
                    key={option.id}
                    value={option.id}
                  >
                    {option.label}
                  </option>
                )
              )}

              {!incidentOptions.some(
                (option) =>
                  option.id === currentId
              ) && (
                <option value={currentId}>
                  {currentId} (Incident)
                </option>
              )}

            </select>

          </div>
        </div>

        <div className="analysis-heading">

          <span className="analysis-eyebrow">
            AI INCIDENT INVESTIGATION
          </span>

          <h1>
            {incident
              ? `${incident.service} Investigation`
              : "Incident Investigation"}
          </h1>

          <p>
            Evidence-backed analysis using
            current incident data and
            historical incident memory.
          </p>

          {!loading && incident && (
            <span className="analysis-status">
              ✓ Analysis Complete ·{" "}
              {currentId}
            </span>
          )}

        </div>
      </header>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <section className="analysis-panel">

          <div
            style={{
              padding: "40px",
              textAlign: "center",
              fontWeight: "600",
              color: "#64748b",
            }}
          >
            Loading AI incident analysis...
          </div>

        </section>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && !loading && (
        <section className="analysis-panel">

          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#b91c1c",
              fontWeight: "600",
            }}
          >

            <div
              style={{
                marginBottom: "12px",
              }}
            >
              {error}
            </div>

            <button
              onClick={() =>
                setCurrentId(
                  String(currentId)
                )
              }
              style={{
                padding:
                  "8px 16px",
                borderRadius: "7px",
                border:
                  "1px solid #cbd5e1",
                background:
                  "#ffffff",
                cursor:
                  "pointer",
                fontWeight:
                  "600",
              }}
            >
              Retry Analysis
            </button>

          </div>

        </section>
      )}

      {/* =====================================================
          MAIN ANALYSIS
      ===================================================== */}

      {!loading && incident && (
        <>

          {/* =================================================
              01 — CURRENT INCIDENT
          ================================================= */}

          <section className="analysis-panel">

            <div className="panel-header">

              <div className="panel-title">

                <span className="panel-number">
                  01
                </span>

                <div>

                  <h2>
                    Current Incident
                  </h2>

                  <p>
                    Evidence collected from
                    the active incident.
                  </p>

                </div>

              </div>

            </div>

            <div className="evidence-grid">

              <div className="evidence-item">

                <span>SERVICE</span>

                <strong>
                  {incident.service}
                </strong>

              </div>

              <div className="evidence-item">

                <span>ERROR</span>

                <strong>
                  {incident.error}
                </strong>

              </div>

              <div className="evidence-item">

                <span>SEVERITY</span>

                <strong className="severity-value">
                  {incident.severity}
                </strong>

              </div>

              <div className="evidence-item">

                <span>DETECTED</span>

                <strong>
                  {incident.detected}
                </strong>

              </div>

            </div>

            <div className="incident-description">
              {incident.description}
            </div>

            {incident.deployment && (
              <div
                style={{
                  marginTop: "14px",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                <strong>
                  Deployment:
                </strong>{" "}
                {incident.deployment}
              </div>
            )}

          </section>

          {/* =================================================
              02 — HISTORICAL RECALL
          ================================================= */}

          <section className="analysis-panel">

            <div className="panel-header">

              <div className="panel-title">

                <span className="panel-number">
                  02
                </span>

                <div>

                  <h2>
                    Historical Recall
                  </h2>

                  <p>
                    Relevant historical incidents
                    retrieved for comparison.
                  </p>

                </div>

              </div>

              <span className="memory-count">
                {incident.historicalCount}{" "}
                memories
              </span>

            </div>

            {incident.memories.length >
            0 ? (

              <div className="memory-grid">

                {incident.memories.map(
                  (memory) => (

                    <article
                      className="recall-card"
                      key={memory.id}
                    >

                      <div className="recall-top">

                        <span className="match-score">
                          {memory.match}
                        </span>

                        <span className="match-label">
                          MATCH
                        </span>

                      </div>

                      <div className="recall-id">
                        {memory.id}
                      </div>

                      <h3>
                        {memory.service}
                      </h3>

                      <p>
                        {memory.description}
                      </p>

                      <div className="recall-outcome">

                        <span>
                          HISTORICAL OUTCOME
                        </span>

                        <strong>
                          {memory.outcome}
                        </strong>

                      </div>

                    </article>

                  )
                )}

              </div>

            ) : (

              <div
                style={{
                  padding: "25px",
                  color: "#64748b",
                }}
              >
                No matching historical
                incidents were found.
              </div>

            )}

          </section>

          {/* =================================================
              TWO COLUMN ANALYSIS
          ================================================= */}

          <div className="analysis-two-column">

            {/* ===============================================
                03 — AI REASONING
            =============================================== */}

            <section className="analysis-panel reasoning-panel">

              <div className="panel-header">

                <div className="panel-title">

                  <span className="panel-number">
                    03
                  </span>

                  <div>

                    <h2>
                      AI Reasoning
                    </h2>

                    <p>
                      How the available evidence
                      influenced the analysis.
                    </p>

                  </div>

                </div>

              </div>

              <div className="reasoning-content">

                <div className="reasoning-step">

                  <span>
                    01
                  </span>

                  <div>

                    <strong>
                      Current evidence
                    </strong>

                    <p>
                      {incident.error} detected
                      on{" "}
                      {incident.service}.
                    </p>

                  </div>

                </div>

                <div className="reasoning-line"></div>

                <div className="reasoning-step">

                  <span>
                    02
                  </span>

                  <div>

                    <strong>
                      Historical patterns
                    </strong>

                    <p>
                      {incident.historicalCount}{" "}
                      historical incident(s)
                      were recalled for
                      comparison.
                    </p>

                  </div>

                </div>

                <div className="reasoning-line"></div>

                <div className="reasoning-step">

                  <span>
                    03
                  </span>

                  <div>

                    <strong>
                      Outcome-aware reasoning
                    </strong>

                    <p>
                      {incident.reasoning}
                    </p>

                  </div>

                </div>

                {incident.rootCause && (
                  <>
                    <div className="reasoning-line"></div>

                    <div className="reasoning-step">

                      <span>
                        04
                      </span>

                      <div>

                        <strong>
                          Current root-cause hypothesis
                        </strong>

                        <p>
                          {incident.rootCause}
                        </p>

                        <small
                          style={{
                            display:
                              "block",
                            marginTop:
                              "6px",
                            color:
                              "#64748b",
                          }}
                        >
                          This is a hypothesis
                          based on available
                          evidence, not a
                          confirmed diagnosis.
                        </small>

                      </div>

                    </div>
                  </>
                )}

                {incident.possibleRootCauses
                  .length > 0 && (
                  <>
                    <div className="reasoning-line"></div>

                    <div className="reasoning-step">

                      <span>
                        05
                      </span>

                      <div>

                        <strong>
                          Possible root causes
                        </strong>

                        <ul
                          style={{
                            marginTop:
                              "8px",
                            paddingLeft:
                              "20px",
                          }}
                        >

                          {incident.possibleRootCauses.map(
                            (
                              cause,
                              index
                            ) => (
                              <li
                                key={
                                  index
                                }
                              >
                                {cause}
                              </li>
                            )
                          )}

                        </ul>

                      </div>

                    </div>
                  </>
                )}

              </div>

            </section>

            {/* ===============================================
                04 — RECOMMENDATION
            =============================================== */}

            <section className="analysis-panel recommendation-panel">

              <div className="panel-header">

                <div className="panel-title">

                  <span className="panel-number">
                    04
                  </span>

                  <div>

                    <h2>
                      Recommendation
                    </h2>

                    <p>
                      Suggested diagnostic action
                      based on the available
                      evidence.
                    </p>

                  </div>

                </div>

              </div>

              <div className="recommendation-box">

                <div className="recommendation-icon">
                  ✦
                </div>

                <div>

                  <span>
                    EVIDENCE-BACKED
                    RECOMMENDATION
                  </span>

                  <h3>
                    {incident.recommendation}
                  </h3>

                  <p>
                    {incident.recommendationReason}
                  </p>

                </div>

              </div>

              <div className="confidence-box">

                <div>

                  <span>
                    CONFIDENCE
                  </span>

                  <strong>
                    {incident.confidence}
                  </strong>

                </div>

                <div className="confidence-track">

                  <div
                    style={{
                      width: `${confidenceNumber}%`,
                    }}
                  ></div>

                </div>

              </div>

              <div
                style={{
                  marginTop: "14px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  fontSize: "12px",
                  color: "#64748b",
                  lineHeight: 1.5,
                }}
              >
                <strong>
                  Safety:
                </strong>{" "}
                This recommendation is
                diagnostic only. No production
                changes are automatically
                executed.
              </div>

            </section>

          </div>

          {/* =================================================
              HUMAN REVIEW
          ================================================= */}

          <section className="human-review">

            <div>

              <span>
                HUMAN-IN-THE-LOOP
              </span>

              <h2>
                Review before taking action
              </h2>

              <p>
                The system provides evidence
                and recommendations, but the
                engineer makes the final
                decision. Feedback can be used
                for future learning.
              </p>

              {!incident.hindsightAvailable && (
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#b45309",
                  }}
                >
                  Note: Live Hindsight is
                  currently unavailable; this
                  analysis is using the local
                  incident-history fallback.
                </p>
              )}

              {incident.hindsightAvailable && (
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#166534",
                  }}
                >
                  ✓ Hindsight memory is connected
                  and historical evidence was
                  available for this analysis.
                </p>
              )}

            </div>

            <button
              className="review-button"
              onClick={onFeedback}
            >
              Review & Give Feedback →
            </button>

          </section>

        </>
      )}

    </main>
  );
}

export default AIAnalysis;