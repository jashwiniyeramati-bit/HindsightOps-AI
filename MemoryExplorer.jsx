import { useEffect, useMemo, useState } from "react";
import "./MemoryExplorer.css";

const BASE_MEMORIES = [
  {
    id: "INC-087",
    title: "Payment API database timeout",
    match: 92,
    rootCause: "Network configuration",
    resolution: "Rolled back network configuration",
    outcome: "Successfully Resolved",
    age: "14 days ago",
    service: "Payment API",
    symptoms: "Database connection timeouts",
    investigation:
      "Engineers checked database connectivity and compared the incident with previous timeout incidents.",
    hypothesis:
      "The initial historical pattern suggested database connection pool saturation.",
    action:
      "Network configuration was investigated after the connection pool evidence did not fully explain the current symptoms.",
    lesson:
      "Similar database timeout symptoms can have different root causes. Current network evidence must be checked before applying the previous pool-based resolution.",
    whatWorked:
      "Comparing the current incident with historical database timeout incidents helped narrow the investigation.",
    whatDidNotWork:
      "Assuming the previous connection-pool diagnosis applied directly to the current incident.",
  },
  {
    id: "INC-064",
    title: "Orders API connection failures",
    match: 78,
    rootCause: "Connection pool exhaustion",
    resolution: "Increased connection pool",
    outcome: "Successfully Resolved",
    age: "31 days ago",
    service: "Orders API",
    symptoms: "Connection failures and database timeout errors",
    investigation:
      "Database connection usage and active connections were reviewed.",
    hypothesis:
      "The connection pool was exhausted under increased request load.",
    action:
      "The database connection pool limit was increased.",
    lesson:
      "Connection pool saturation is a relevant historical pattern for database timeout incidents.",
    whatWorked:
      "Checking active connections and pool limits identified the bottleneck.",
    whatDidNotWork:
      "No failed approach was recorded for this incident.",
  },
  {
    id: "INC-041",
    title: "MongoDB connectivity degradation",
    match: 64,
    rootCause: "Database connection limits",
    resolution: "Adjusted connection limits",
    outcome: "Successfully Resolved",
    age: "67 days ago",
    service: "Payment API",
    symptoms: "MongoDB connectivity degradation and connection failures",
    investigation:
      "MongoDB connection usage and database-side connection limits were investigated.",
    hypothesis:
      "The configured connection limits were contributing to the connectivity degradation.",
    action:
      "Database connection limits were adjusted.",
    lesson:
      "MongoDB connectivity incidents should be evaluated against both application-side pool settings and database-side connection limits.",
    whatWorked:
      "Reviewing connection limits alongside application connection behavior.",
    whatDidNotWork:
      "No failed approach was recorded for this incident.",
  },
];

function MemoryExplorer({ onBack, learnedMemory }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedMemory, setSelectedMemory] = useState(null);

  /*
   * Add the newly learned memory after engineer feedback.
   */
  const memories = useMemo(() => {
    const result = [...BASE_MEMORIES];

    if (learnedMemory) {
      result.unshift({
        id: learnedMemory.incidentId || "NEW-INCIDENT",
        title:
          learnedMemory.title ||
          `${learnedMemory.service || "Service"} incident outcome`,
        match: 100,
        rootCause:
          learnedMemory.rootCause ||
          "Network configuration change",
        resolution:
          learnedMemory.resolution ||
          learnedMemory.recommendation ||
          "Engineer-recorded resolution",
        outcome:
          learnedMemory.outcome === "resolved"
            ? "Successfully Resolved"
            : learnedMemory.outcome === "partial"
            ? "Partially Resolved"
            : "Resolution Failed",
        age: "Just now",
        service: learnedMemory.service || "Unknown service",
        symptoms: learnedMemory.symptoms || "Incident symptoms recorded by engineer",
        investigation:
          learnedMemory.investigation ||
          "Engineer feedback and incident evidence were reviewed.",
        hypothesis:
          learnedMemory.hypothesis ||
          learnedMemory.recommendation ||
          "Historical evidence was used to form an initial hypothesis.",
        action:
          learnedMemory.action ||
          learnedMemory.recommendation ||
          "Engineer reviewed the AI recommendation.",
        lesson:
          learnedMemory.lesson ||
          learnedMemory.comment ||
          "The actual incident outcome was retained for future reasoning.",
        whatWorked:
          learnedMemory.whatWorked ||
          learnedMemory.comment ||
          "Engineer feedback was retained as a learning signal.",
        whatDidNotWork:
          learnedMemory.whatDidNotWork ||
          "No additional failed approach was recorded.",
        newMemory: true,
        decision: learnedMemory.decision,
        comment: learnedMemory.comment,
      });
    }

    return result;
  }, [learnedMemory]);

  /*
   * Close the memory modal with Escape.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedMemory(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredMemories = useMemo(() => {
    let result = memories.filter((memory) => {
      const text = `
        ${memory.id}
        ${memory.title}
        ${memory.service}
        ${memory.rootCause}
        ${memory.resolution}
        ${memory.outcome}
        ${memory.symptoms}
        ${memory.lesson}
      `.toLowerCase();

      return text.includes(search.trim().toLowerCase());
    });

    if (sortBy === "match") {
      result.sort((a, b) => b.match - a.match);
    }

    if (sortBy === "recent") {
      result.sort((a, b) => {
        if (a.age === "Just now") return -1;
        if (b.age === "Just now") return 1;
        return 0;
      });
    }

    return result;
  }, [memories, search, sortBy]);

  const getMatchClass = (match) => {
    if (match >= 90) return "high-match";
    if (match >= 75) return "medium-match";
    return "low-match";
  };

  const memoryCount = learnedMemory ? 129 : 128;

  return (
    <main className="memory-page">
      {/* Back */}

      <button className="memory-back" onClick={onBack}>
        ← Dashboard
      </button>

      {/* Header */}

      <div className="memory-header">
        <div>
          <h1>Memory Explorer</h1>

          <p>
            Explore what Hindsight has learned from previous incidents
          </p>
        </div>

        <div className="memory-count">
          <strong>{memoryCount}</strong>

          <span>Learned Memories</span>
        </div>
      </div>

      {/* Search */}

      <div className="memory-search">
        <span className="search-icon">🔍</span>

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setSearch(event.target.value.trim());
            }
          }}
          placeholder="Search incidents, root causes, resolutions..."
        />

        <button
          onClick={() => setSearch(search.trim())}
          type="button"
        >
          Search
        </button>
      </div>

      {/* Stats */}

      <section className="memory-stats">
        <div className="memory-stat-card">
          <span>Total Memories</span>

          <strong>{memoryCount}</strong>
        </div>

        <div className="memory-stat-card">
          <span>Used in Recommendations</span>

          <strong>94</strong>
        </div>

        <div className="memory-stat-card">
          <span>Successful Outcomes</span>

          <strong>87%</strong>
        </div>

        <div className="memory-stat-card">
          <span>Learned This Week</span>

          <strong>{learnedMemory ? 9 : 8}</strong>
        </div>
      </section>

      {/* Historical Memories */}

      <section className="historical-section">
        <div className="memory-list-header">
          <div>
            <h2>Historical Memories</h2>

            <p>
              Past incidents that can influence current reasoning
            </p>
          </div>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="relevance">Most Relevant</option>

            <option value="recent">Most Recent</option>

            <option value="match">Highest Confidence</option>
          </select>
        </div>

        {/* Empty Search State */}

        {filteredMemories.length === 0 && (
          <div className="memory-empty">
            <div className="empty-icon">🔍</div>

            <h3>No memories found</h3>

            <p>
              Try searching for another incident, service,
              root cause, or resolution.
            </p>
          </div>
        )}

        {/* Memory Cards */}

        {filteredMemories.map((memory) => (
          <div
            className={
              memory.newMemory
                ? "explorer-card new-memory"
                : "explorer-card"
            }
            key={memory.id}
          >
            {memory.newMemory && (
              <div className="new-memory-label">
                🧠 NEWLY LEARNED
              </div>
            )}

            <div className="explorer-card-top">
              <div>
                <span className="memory-id">
                  {memory.id}
                </span>

                <h3>{memory.title}</h3>
              </div>

              <span
                className={`match ${getMatchClass(memory.match)}`}
              >
                {memory.match}% Match
              </span>
            </div>

            <div className="memory-details">
              <div>
                <span>ROOT CAUSE</span>

                <strong>{memory.rootCause}</strong>
              </div>

              <div>
                <span>RESOLUTION</span>

                <strong>{memory.resolution}</strong>
              </div>

              <div>
                <span>OUTCOME</span>

                <strong
                  className={
                    memory.outcome === "Successfully Resolved"
                      ? "success-text"
                      : memory.outcome === "Partially Resolved"
                      ? "partial-text"
                      : "failed-text"
                  }
                >
                  {memory.outcome}
                </strong>
              </div>
            </div>

            <div className="memory-footer">
              <span>
                Learned from incident · {memory.age}
              </span>

              <button
                type="button"
                className="view-memory-button"
                onClick={() => setSelectedMemory(memory)}
              >
                View Memory →
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* =====================================================
          MEMORY DETAIL MODAL
      ===================================================== */}

      {selectedMemory && (
        <div
          className="memory-modal-overlay"
          onClick={() => setSelectedMemory(null)}
        >
          <div
            className="memory-detail-panel"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}

            <div className="detail-panel-header">
              <div>
                <span>HINDSIGHT MEMORY</span>

                <h2>{selectedMemory.id}</h2>

                {selectedMemory.newMemory && (
                  <div className="modal-new-label">
                    🧠 Newly learned
                  </div>
                )}
              </div>

              <button
                type="button"
                className="detail-close-button"
                onClick={() => setSelectedMemory(null)}
                aria-label="Close memory"
              >
                ×
              </button>
            </div>

            {/* Main Details */}

            <div className="detail-panel-grid">
              <div>
                <span>INCIDENT</span>

                <strong>{selectedMemory.title}</strong>
              </div>

              <div>
                <span>MATCH</span>

                <strong>{selectedMemory.match}%</strong>
              </div>

              <div>
                <span>SERVICE</span>

                <strong>{selectedMemory.service}</strong>
              </div>

              <div>
                <span>ROOT CAUSE</span>

                <strong>{selectedMemory.rootCause}</strong>
              </div>

              <div>
                <span>RESOLUTION</span>

                <strong>{selectedMemory.resolution}</strong>
              </div>

              <div>
                <span>OUTCOME</span>

                <strong
                  className={
                    selectedMemory.outcome ===
                    "Successfully Resolved"
                      ? "success-text"
                      : selectedMemory.outcome ===
                        "Partially Resolved"
                      ? "partial-text"
                      : "failed-text"
                  }
                >
                  {selectedMemory.outcome}
                </strong>
              </div>
            </div>

            {/* Problem */}

            <div className="memory-section">
              <span>PROBLEM / SYMPTOMS</span>

              <p>{selectedMemory.symptoms}</p>
            </div>

            {/* Investigation */}

            <div className="memory-section">
              <span>INVESTIGATION</span>

              <p>{selectedMemory.investigation}</p>
            </div>

            {/* Hypothesis */}

            <div className="memory-section">
              <span>HYPOTHESIS</span>

              <p>{selectedMemory.hypothesis}</p>
            </div>

            {/* Action */}

            <div className="memory-section">
              <span>ACTION TAKEN</span>

              <p>{selectedMemory.action}</p>
            </div>

            {/* What Worked */}

            <div className="memory-section memory-section-success">
              <span>WHAT WORKED</span>

              <p>{selectedMemory.whatWorked}</p>
            </div>

            {/* What Didn't Work */}

            <div className="memory-section memory-section-warning">
              <span>WHAT DID NOT WORK</span>

              <p>{selectedMemory.whatDidNotWork}</p>
            </div>

            {/* Lesson */}

            <div className="memory-section memory-section-lesson">
              <span>LESSON LEARNED</span>

              <p>{selectedMemory.lesson}</p>
            </div>

            {/* Engineer Decision */}

            {selectedMemory.decision && (
              <div className="memory-section">
                <span>ENGINEER DECISION</span>

                <p>{selectedMemory.decision}</p>
              </div>
            )}

            {/* Engineer Comment */}

            {selectedMemory.comment && (
              <div className="memory-note">
                <span>ENGINEER NOTE</span>

                <p>{selectedMemory.comment}</p>
              </div>
            )}

            {/* Footer */}

            <div className="memory-modal-footer">
              <span>
                Learned from incident · {selectedMemory.age}
              </span>

              <button
                type="button"
                onClick={() => setSelectedMemory(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Learning Loop */}

      <section className="learning-loop">
        <div className="learning-loop-heading">
          <h2>How Hindsight Learns</h2>

          <p>
            Every resolved incident becomes organizational memory.
          </p>
        </div>

        <div className="loop">
          <div className="loop-step">
            <span>1</span>

            <strong>Incident</strong>

            <small>Current evidence</small>
          </div>

          <div className="loop-arrow">→</div>

          <div className="loop-step">
            <span>2</span>

            <strong>Recall</strong>

            <small>Find similar history</small>
          </div>

          <div className="loop-arrow">→</div>

          <div className="loop-step">
            <span>3</span>

            <strong>Reason</strong>

            <small>Generate recommendation</small>
          </div>

          <div className="loop-arrow">→</div>

          <div className="loop-step">
            <span>4</span>

            <strong>Learn</strong>

            <small>Store actual outcome</small>
          </div>
        </div>
      </section>
    </main>
  );
}

export default MemoryExplorer;