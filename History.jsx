import { useMemo, useState } from "react";
import "./History.css";

function History({ onBack }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");

  const incidents = [
    {
      id: "INC-087",
      service: "Payment API",
      title: "Database timeout",
      severity: "P1",
      status: "resolved",
      duration: "14 min",
      cause: "Network configuration",
      resolution: "Rolled back network configuration",
      date: "14 days ago",
    },
    {
      id: "INC-076",
      service: "Auth Service",
      title: "Authentication failures",
      severity: "P2",
      status: "resolved",
      duration: "12 min",
      cause: "Identity provider configuration",
      resolution: "Rolled back authentication configuration",
      date: "18 days ago",
    },
    {
      id: "INC-064",
      service: "Orders API",
      title: "Connection failures",
      severity: "P2",
      status: "resolved",
      duration: "21 min",
      cause: "Connection pool exhaustion",
      resolution: "Increased connection pool",
      date: "31 days ago",
    },
    {
      id: "INC-052",
      service: "Identity Service",
      title: "Login failures",
      severity: "P1",
      status: "resolved",
      duration: "17 min",
      cause: "Authentication policy change",
      resolution: "Reverted authentication policy",
      date: "42 days ago",
    },
    {
      id: "INC-041",
      service: "Payment API",
      title: "MongoDB connectivity degradation",
      severity: "P2",
      status: "resolved",
      duration: "18 min",
      cause: "Database connection limits",
      resolution: "Adjusted connection limits",
      date: "67 days ago",
    },
  ];

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const text = `
        ${incident.id}
        ${incident.service}
        ${incident.title}
        ${incident.cause}
        ${incident.resolution}
      `.toLowerCase();

      const matchesSearch =
        text.includes(search.toLowerCase());

      const matchesStatus =
        status === "all" ||
        incident.status === status;

      const matchesSeverity =
        severity === "all" ||
        incident.severity === severity;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSeverity
      );
    });
  }, [search, status, severity]);

  return (
    <main className="history-page">

      <button
        className="history-back"
        onClick={onBack}
      >
        ← Dashboard
      </button>

      <div className="history-header">

        <div>
          <span className="history-eyebrow">
            INCIDENT HISTORY
          </span>

          <h1>
            Historical Incidents
          </h1>

          <p>
            Review previous incidents, resolutions,
            and outcomes retained by Hindsight.
          </p>
        </div>

        <div className="history-count">
          <strong>128</strong>
          <span>Total Incidents</span>
        </div>

      </div>


      {/* Stats */}

      <section className="history-stats">

        <div>
          <span>Total Incidents</span>
          <strong>128</strong>
        </div>

        <div>
          <span>Resolved</span>
          <strong>117</strong>
        </div>

        <div>
          <span>Avg Resolution</span>
          <strong>18 min</strong>
        </div>

        <div>
          <span>Learned Patterns</span>
          <strong>42</strong>
        </div>

      </section>


      {/* Filters */}

      <section className="history-filter-card">

        <div className="history-search">

          <span>🔍</span>

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search incidents, services, causes..."
          />

        </div>


        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
        >
          <option value="all">
            All Status
          </option>

          <option value="resolved">
            Resolved
          </option>
        </select>


        <select
          value={severity}
          onChange={(e) =>
            setSeverity(e.target.value)
          }
        >
          <option value="all">
            All Severity
          </option>

          <option value="P1">
            P1
          </option>

          <option value="P2">
            P2
          </option>

        </select>

      </section>


      {/* Results */}

      <section>

        <div className="history-results-header">

          <div>
            <h2>
              Incident Records
            </h2>

            <p>
              {filteredIncidents.length} incidents found
            </p>
          </div>

        </div>


        {filteredIncidents.length === 0 && (

          <div className="history-empty">

            <div>🔎</div>

            <h3>
              No incidents found
            </h3>

            <p>
              Try changing your search or filters.
            </p>

          </div>

        )}


        {filteredIncidents.map((incident) => (

          <article
            className="history-card"
            key={incident.id}
          >

            <div className="history-card-top">

              <div>

                <span className="history-id">
                  {incident.id}
                </span>

                <h3>
                  {incident.service}
                </h3>

                <p>
                  {incident.title}
                </p>

              </div>


              <div className="history-badges">

                <span
                  className={
                    incident.severity === "P1"
                      ? "history-severity p1"
                      : "history-severity p2"
                  }
                >
                  {incident.severity}
                </span>

                <span className="resolved-badge">
                  ✓ Resolved
                </span>

              </div>

            </div>


            <div className="history-details">

              <div>
                <span>
                  ROOT CAUSE
                </span>

                <strong>
                  {incident.cause}
                </strong>
              </div>

              <div>
                <span>
                  RESOLUTION
                </span>

                <strong>
                  {incident.resolution}
                </strong>
              </div>

              <div>
                <span>
                  DURATION
                </span>

                <strong>
                  {incident.duration}
                </strong>
              </div>

            </div>


            <div className="history-card-footer">

              <span>
                Retained in Hindsight · {incident.date}
              </span>

              <span className="memory-linked">
                🧠 Memory available
              </span>

            </div>

          </article>

        ))}

      </section>


      {/* Learning message */}

      <section className="history-learning">

        <div className="history-learning-icon">
          🧠
        </div>

        <div>

          <span>
            HINDSIGHT MEMORY
          </span>

          <h2>
            Every resolved incident can become
            organizational knowledge.
          </h2>

          <p>
            Historical incidents provide context for
            future investigations and help the system
            learn from real engineer decisions and
            outcomes.
          </p>

        </div>

      </section>

    </main>
  );
}

export default History;