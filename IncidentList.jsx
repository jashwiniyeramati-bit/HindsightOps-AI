import { useState, useMemo, useRef } from "react";
import NewIncidentForm from "./NewIncidentForm";
import "./IncidentList.css";

function IncidentList({ onBack, onIncidentClick }) {
  const [incidents, setIncidents] = useState([
    {
      id: "INC-104",
      service: "payment-api",
      severity: "P1",
      error: "MongoServerSelectionTimeoutError",
      status: "Investigating",
      deployment: "v2.4.1",
      time: "10:42 AM",
    },
    {
      id: "INC-103",
      service: "auth-service",
      severity: "P2",
      error: "Authentication timeout",
      status: "Investigating",
      deployment: "v3.1.0",
      time: "09:31 AM",
    },
    {
      id: "INC-102",
      service: "cache-service",
      severity: "P2",
      error: "Redis connection errors",
      status: "Monitoring",
      deployment: "v1.8.2",
      time: "08:15 AM",
    },
    {
      id: "INC-101",
      service: "orders-api",
      severity: "P2",
      error: "HTTP 502 Bad Gateway",
      status: "Resolved",
      deployment: "v4.2.0",
      time: "Yesterday",
    },
  ]);

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All Severities");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  // Form State
  const [showForm, setShowForm] = useState(false);

  const formSectionRef = useRef(null);
  const serviceInputRef = useRef(null);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      const matchSearch =
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.service.toLowerCase().includes(search.toLowerCase()) ||
        item.error.toLowerCase().includes(search.toLowerCase());

      const matchSeverity =
        severityFilter === "All Severities" || item.severity === severityFilter;

      const matchStatus =
        statusFilter === "All Statuses" || item.status === statusFilter;

      return matchSearch && matchSeverity && matchStatus;
    });
  }, [incidents, search, severityFilter, statusFilter]);

  const handleOpenForm = () => {
    setShowForm(true);
    setTimeout(() => {
      if (formSectionRef.current) {
        formSectionRef.current.scrollIntoView({ behavior: "smooth" });
      }
      if (serviceInputRef.current) {
        serviceInputRef.current.focus();
      }
    }, 80);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateIncident = async (newIncidentData) => {
    const nextNumber = 105 + (incidents.length - 4);
    const newId = `INC-${nextNumber}`;
    const newEntry = {
      id: newId,
      service: newIncidentData.service,
      severity: newIncidentData.severity,
      error: newIncidentData.error,
      status: "Investigating",
      deployment: newIncidentData.deployment || "v1.0.0",
      time: "Just now",
    };

    setIncidents([newEntry, ...incidents]);
    setShowForm(false);

    // Seamlessly navigate to investigate newly created incident
    onIncidentClick(newId);
  };

  return (
    <main className="incident-page">
      <div className="incident-page-header">
        <div>
          <button className="back-button" onClick={onBack}>
            ← Dashboard
          </button>
          <h1>Incidents</h1>
          <p>Monitor and investigate production incidents</p>
        </div>

        <button
          className="new-incident-btn"
          onClick={handleOpenForm}
        >
          + New Incident
        </button>
      </div>

      <div className="incident-toolbar">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search incidents, services, errors..."
        />

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option>All Severities</option>
          <option>P1</option>
          <option>P2</option>
          <option>P3</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All Statuses</option>
          <option>Investigating</option>
          <option>Monitoring</option>
          <option>Resolved</option>
        </select>
      </div>

      <div className="incident-table">
        <div className="table-header">
          <span>Incident</span>
          <span>Service</span>
          <span>Severity</span>
          <span>Error</span>
          <span>Status</span>
          <span>Deployment</span>
          <span>Time</span>
        </div>

        {filteredIncidents.map((inc) => (
          <div
            key={inc.id}
            className="table-row clickable-row"
            onClick={() => onIncidentClick(inc.id)}
          >
            <strong>{inc.id}</strong>
            <span>{inc.service}</span>
            <span>
              <b
                className={`severity-badge ${
                  inc.severity === "P1"
                    ? "p1"
                    : inc.severity === "P2"
                    ? "p2"
                    : "p3"
                }`}
              >
                {inc.severity}
              </b>
            </span>
            <span className="error-text">{inc.error}</span>
            <span>
              <b
                className={`status-badge ${
                  inc.status === "Investigating"
                    ? "investigating"
                    : inc.status === "Monitoring"
                    ? "monitoring"
                    : "resolved"
                }`}
              >
                {inc.status}
              </b>
            </span>
            <span>{inc.deployment}</span>
            <span className="time-text">{inc.time}</span>
          </div>
        ))}
      </div>

      {/* DEDICATED FULL-WIDTH CREATE NEW INCIDENT SECTION */}
      {showForm && (
        <NewIncidentForm
          ref={formSectionRef}
          serviceInputRef={serviceInputRef}
          onSubmit={handleCreateIncident}
          onCancel={handleCancelForm}
        />
      )}
    </main>
  );
}

export default IncidentList;