import "./IncidentDetails.css";

function IncidentDetails({
  incidentId,
  onBack,
  onAIAnalysis,
}) {
  const incidents = {
    "INC-104": {
      id: "INC-104",
      service: "Payment API",
      serviceName: "payment-api",
      severity: "P1 — Critical",
      severityClass: "critical",
      status: "Investigating",
      started: "10:42 AM",
      summary:
        "Payment requests are failing due to database connection timeouts. The Payment API is experiencing elevated error rates.",
      error: "MongoServerSelectionTimeoutError",
      errorRate: "38.7%",
      latency: "4.8s",
      logs: [
        "[10:42:11] ERROR payment-api",
        "MongoServerSelectionTimeoutError",
        "Server selection timed out after 30000 ms",
        "[10:42:15] ERROR payment-api",
        "Database connection unavailable",
      ],
      memoryMatch: "92%",
      memoryTitle: "Payment API database timeout",
      memoryDescription:
        "Previous Payment API incidents showed similar MongoDB connection failures after infrastructure configuration changes.",
      memoryOutcome:
        "Network configuration rollback resolved the incident in 14 minutes.",
    },

    "INC-103": {
      id: "INC-103",
      service: "Auth Service",
      serviceName: "auth-service",
      severity: "P2 — High",
      severityClass: "high",
      status: "Investigating",
      started: "09:18 AM",
      summary:
        "Authentication failures have increased significantly, causing users to experience failed login requests.",
      error: "AuthenticationFailureRateExceeded",
      errorRate: "27.4%",
      latency: "2.1s",
      logs: [
        "[09:18:04] ERROR auth-service",
        "AuthenticationFailureRateExceeded",
        "Failed login requests exceeded threshold",
        "[09:18:12] WARN auth-service",
        "Identity provider configuration mismatch",
      ],
      memoryMatch: "88%",
      memoryTitle: "Authentication configuration failure",
      memoryDescription:
        "Previous authentication incidents showed similar failure patterns after identity provider configuration updates.",
      memoryOutcome:
        "Rolling back the authentication configuration resolved the incident in 12 minutes.",
    },

    "INC-102": {
      id: "INC-102",
      service: "Cache Service",
      serviceName: "cache-service",
      severity: "P2 — High",
      severityClass: "high",
      status: "Investigating",
      started: "08:51 AM",
      summary:
        "Redis memory usage has exceeded the configured limit, causing increasing cache failures and degraded service performance.",
      error: "RedisMemoryLimitExceeded",
      errorRate: "31.2%",
      latency: "3.6s",
      logs: [
        "[08:51:09] ERROR cache-service",
        "RedisMemoryLimitExceeded",
        "Memory usage exceeded configured threshold",
        "[08:51:18] WARN cache-service",
        "Stale cache entries detected",
      ],
      memoryMatch: "84%",
      memoryTitle: "Redis memory exhaustion",
      memoryDescription:
        "Historical cache incidents showed rapid memory growth caused by stale entries and increased traffic.",
      memoryOutcome:
        "Clearing stale entries and increasing memory allocation resolved the incident in 16 minutes.",
    },
  };

  const incident =
    incidents[incidentId] || incidents["INC-104"];

  return (
    <main className="incident-details-page">

      {/* HEADER */}

      <div className="details-header">

        <div>
          <button
            className="details-back"
            onClick={onBack}
          >
            ← Back to Incidents
          </button>

          <div className="details-title-row">

            <h1>
              Incident Details
            </h1>

            <span className="incident-id">
              {incident.id}
            </span>

          </div>

          <p className="details-subtitle">
            Investigating {incident.service} incident
          </p>
        </div>

        <button
          className="primary-action"
          onClick={onAIAnalysis}
        >
          ✦ Run AI Analysis
        </button>

      </div>


      {/* OVERVIEW */}

      <section className="details-grid">

        <div className="detail-card">
          <span className="card-label">
            SERVICE
          </span>

          <strong>
            {incident.service}
          </strong>

          <small>
            {incident.serviceName}
          </small>
        </div>


        <div className="detail-card">
          <span className="card-label">
            SEVERITY
          </span>

          <strong
            className={`detail-severity ${incident.severityClass}`}
          >
            {incident.severity}
          </strong>

          <small>
            Production impact
          </small>
        </div>


        <div className="detail-card">
          <span className="card-label">
            STATUS
          </span>

          <strong className="detail-status">
            ● {incident.status}
          </strong>

          <small>
            Awaiting investigation
          </small>
        </div>


        <div className="detail-card">
          <span className="card-label">
            STARTED
          </span>

          <strong>
            {incident.started}
          </strong>

          <small>
            Active incident
          </small>
        </div>

      </section>


      {/* SUMMARY */}

      <section className="details-section">

        <div className="section-heading">
          <div>
            <h2>
              Incident Summary
            </h2>

            <p>
              Current system state reported by monitoring.
            </p>
          </div>
        </div>

        <div className="summary-card">
          <p>
            {incident.summary}
          </p>
        </div>

      </section>


      {/* CURRENT EVIDENCE */}

      <section className="details-section">

        <div className="section-heading">
          <div>
            <h2>
              Current Evidence
            </h2>

            <p>
              Signals collected from the affected service.
            </p>
          </div>
        </div>


        <div className="evidence-grid">

          <div className="evidence-card">
            <span>SERVICE</span>
            <strong>
              {incident.serviceName}
            </strong>
          </div>

          <div className="evidence-card">
            <span>ERROR</span>
            <strong>
              {incident.error}
            </strong>
          </div>

          <div className="evidence-card">
            <span>ERROR RATE</span>
            <strong className="danger-value">
              {incident.errorRate}
            </strong>
          </div>

          <div className="evidence-card">
            <span>LATENCY</span>
            <strong>
              {incident.latency}
            </strong>
          </div>

        </div>

      </section>


      {/* LOGS */}

      <section className="details-section">

        <div className="section-heading">
          <div>
            <h2>
              Recent Logs
            </h2>

            <p>
              Latest evidence captured from the service.
            </p>
          </div>
        </div>

        <div className="log-box">

          {incident.logs.map((log, index) => (
            <div
              key={index}
              className={
                log.includes("ERROR")
                  ? "log-error"
                  : ""
              }
            >
              {log}
            </div>
          ))}

        </div>

      </section>


      {/* HINDSIGHT CONTEXT */}

      <section className="details-section">

        <div className="section-heading">

          <div>
            <h2>
              Hindsight Context
            </h2>

            <p>
              Historical memory relevant to this incident.
            </p>
          </div>

          <span className="ai-badge">
            🧠 Memory Recall
          </span>

        </div>


        <div className="memory-card">

          <div className="memory-top">

            <div>
              <strong>
                {incident.memoryTitle}
              </strong>

              <span>
                Historical incident · {incident.memoryMatch} match
              </span>
            </div>

            <span className="resolved-memory">
              ✓ Resolved
            </span>

          </div>


          <p>
            {incident.memoryDescription}
          </p>


          <div className="memory-outcome">
            <strong>
              Historical outcome:
            </strong>{" "}
            {incident.memoryOutcome}
          </div>

        </div>

      </section>


      {/* AI CTA */}

      <section className="analysis-cta">

        <div>

          <span className="cta-eyebrow">
            HINDSIGHT INVESTIGATION
          </span>

          <h3>
            Ready for AI Investigation?
          </h3>

          <p>
            Hindsight will compare the current evidence
            with historical incidents and their actual
            outcomes before generating a recommendation.
          </p>

        </div>


        <button
          className="primary-action"
          onClick={onAIAnalysis}
        >
          ✦ Analyze with Hindsight →
        </button>

      </section>

    </main>
  );
}

export default IncidentDetails;