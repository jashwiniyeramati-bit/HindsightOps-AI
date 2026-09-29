import { useState } from "react";
import "./App.css";

import IncidentList from "./IncidentList";
import IncidentDetails from "./IncidentDetails";
import MemoryExplorer from "./MemoryExplorer";
import LearningTimeline from "./LearningTimeline";
import BeforeAfter from "./BeforeAfter";
import History from "./History";
import EngineerFeedback from "./EngineerFeedback";
import AIAnalysis from "./AIAnalysis";

function App() {
  const [page, setPage] = useState("dashboard");

  const [selectedIncident, setSelectedIncident] =
    useState("INC-104");

  const [learnedMemory, setLearnedMemory] =
    useState(null);

  const openIncident = (id) => {
    setSelectedIncident(id);
    setPage("details");
  };

  const openAnalysis = () => {
    setPage("analysis");
  };

  const handleLearning = (memory) => {
    setLearnedMemory(memory);
    setPage("learning");
  };

  return (
    <div className="app">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="logo">
          <span>◈</span>
          Hindsight
        </div>

        <div className="logo-subtitle">
          Incident Response Copilot
        </div>

        <nav>

          <button
            className={
              page === "dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("dashboard")
            }
          >
            ◉ Dashboard
          </button>

          <button
            className={
              page === "incidents" ||
              page === "details"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("incidents")
            }
          >
            ◉ Incidents
          </button>

          <button
            className={
              page === "history"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("history")
            }
          >
            ◷ History
          </button>

          <button
            className={
              page === "memory"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("memory")
            }
          >
            ◈ Memory Explorer
          </button>

          <button
            className={
              page === "learning"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("learning")
            }
          >
            ↗ Learning
          </button>

          <button
            className={
              page === "before-after"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("before-after")
            }
          >
            ⇄ Before / After
          </button>

          <button
            className={
              page === "feedback"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("feedback")
            }
          >
            ✓ Engineer Feedback
          </button>

          <button
            className={
              page === "analysis"
                ? "active"
                : ""
            }
            onClick={() => {
              setSelectedIncident("INC-104");
              setPage("analysis");
            }}
          >
            ✦ AI Analysis
          </button>

        </nav>

        <div className="sidebar-footer">

          <div className="status-dot"></div>

          Hindsight Connected

        </div>

      </aside>


      {/* ================= MAIN CONTENT ================= */}

      <main className="main-content">

        {/* ================= DASHBOARD ================= */}

        {page === "dashboard" && (

          <div className="dashboard">

            <div className="topbar">

              <div>

                <h1>
                  Good afternoon 👋
                </h1>

                <p>
                  Here's what's happening with
                  your systems.
                </p>

              </div>

              <button
                className="new-incident"
                onClick={() => {
                  setSelectedIncident(
                    "INC-104"
                  );

                  setPage("analysis");
                }}
              >
                ✦ AI Analysis
              </button>

            </div>


            <div className="stats-grid">

              <div className="stat-card">

                <span>
                  Active Incidents
                </span>

                <strong>
                  4
                </strong>

              </div>


              <div className="stat-card critical-stat">

                <span>
                  Critical
                </span>

                <strong>
                  2
                </strong>

              </div>


              <div className="stat-card">

                <span>
                  Resolved Today
                </span>

                <strong>
                  17
                </strong>

              </div>


              <div className="stat-card">

                <span>
                  Memories Learned
                </span>

                <strong>
                  {learnedMemory
                    ? "129"
                    : "128"}
                </strong>

              </div>

            </div>


            {/* ACTIVE INCIDENTS */}

            <section className="dashboard-section">

              <div className="section-heading">

                <h2>
                  Active Incidents
                </h2>

                <button
                  onClick={() =>
                    setPage("incidents")
                  }
                >
                  View all →
                </button>

              </div>


              <div className="incident-cards">

                <div
                  className="dashboard-incident"
                  onClick={() =>
                    openIncident(
                      "INC-104"
                    )
                  }
                >

                  <div>

                    <span className="severity critical">
                      P1
                    </span>

                    <strong>
                      Payment API
                    </strong>

                    <p>
                      Database connection
                      timeouts
                    </p>

                  </div>

                  <span>
                    10:42 AM →
                  </span>

                </div>


                <div
                  className="dashboard-incident"
                  onClick={() =>
                    openIncident(
                      "INC-103"
                    )
                  }
                >

                  <div>

                    <span className="severity warning">
                      P2
                    </span>

                    <strong>
                      Auth Service
                    </strong>

                    <p>
                      Elevated authentication
                      failures
                    </p>

                  </div>

                  <span>
                    09:18 AM →
                  </span>

                </div>


                <div
                  className="dashboard-incident"
                  onClick={() =>
                    openIncident(
                      "INC-102"
                    )
                  }
                >

                  <div>

                    <span className="severity warning">
                      P2
                    </span>

                    <strong>
                      Cache Service
                    </strong>

                    <p>
                      High memory usage
                    </p>

                  </div>

                  <span>
                    08:51 AM →
                  </span>

                </div>

              </div>

            </section>


            {/* HINDSIGHT IMPACT */}

            <section className="dashboard-section">

              <div className="section-heading">

                <h2>
                  Hindsight Impact
                </h2>

              </div>


              <div className="impact-card">

                <div>

                  <span>
                    Without Hindsight
                  </span>

                  <strong>
                    47 min
                  </strong>

                  <p>
                    Average investigation time
                  </p>

                </div>


                <div className="impact-arrow">
                  →
                </div>


                <div>

                  <span>
                    With Hindsight
                  </span>

                  <strong>
                    18 min
                  </strong>

                  <p>
                    Average investigation time
                  </p>

                </div>

              </div>

            </section>

          </div>
        )}


        {/* ================= INCIDENT LIST ================= */}

        {page === "incidents" && (

          <IncidentList
            onBack={() =>
              setPage("dashboard")
            }
            onIncidentClick={
              openIncident
            }
          />

        )}


        {/* ================= INCIDENT DETAILS ================= */}

        {page === "details" && (

          <IncidentDetails
            incidentId={
              selectedIncident
            }
            onBack={() =>
              setPage("incidents")
            }
            onAIAnalysis={
              openAnalysis
            }
          />

        )}


        {/* ================= AI ANALYSIS ================= */}

        {page === "analysis" && (

          <AIAnalysis
            incidentId={
              selectedIncident
            }
            onBack={() =>
              setPage("details")
            }
            onFeedback={() =>
              setPage("feedback")
            }
          />

        )}


        {/* ================= ENGINEER FEEDBACK ================= */}

        {page === "feedback" && (

          <EngineerFeedback
            incidentId={
              selectedIncident
            }
            onBack={() =>
              setPage("analysis")
            }
            onLearning={
              handleLearning
            }
          />

        )}


        {/* ================= LEARNING ================= */}

        {page === "learning" && (

          <LearningTimeline
            onBack={() =>
              setPage("dashboard")
            }
            learnedMemory={
              learnedMemory
            }
          />

        )}


        {/* ================= MEMORY EXPLORER ================= */}

        {page === "memory" && (

          <MemoryExplorer
            onBack={() =>
              setPage("dashboard")
            }
            learnedMemory={
              learnedMemory
            }
          />

        )}


        {/* ================= HISTORY ================= */}

        {page === "history" && (

          <History
            onBack={() =>
              setPage("dashboard")
            }
          />

        )}


        {/* ================= BEFORE / AFTER ================= */}

        {page === "before-after" && (

          <BeforeAfter
            onBack={() =>
              setPage("dashboard")
            }
          />

        )}

      </main>

    </div>
  );
}

export default App;