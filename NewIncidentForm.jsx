import { useState, forwardRef } from "react";
import "./NewIncidentForm.css";

const SEVERITIES = [
  { value: "P1", label: "P1", hint: "Critical" },
  { value: "P2", label: "P2", hint: "Major" },
  { value: "P3", label: "P3", hint: "Minor" },
];

const INITIAL = { service: "", severity: "P1", deployment: "v1.0.0", error: "" };

const NewIncidentForm = forwardRef(function NewIncidentForm(
  { onSubmit, onCancel, serviceInputRef },
  ref
) {
  const [form, setForm] = useState(INITIAL);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const blur = (key) => () => setTouched((t) => ({ ...t, [key]: true }));

  const errors = {
    service: form.service.trim() ? "" : "Enter the affected service, e.g. payment-api.",
    deployment: form.deployment.trim() ? "" : "Enter the deployment tag, e.g. v2.4.1.",
    error: form.error.trim() ? "" : "Paste the error message or failure signal.",
  };
  const isValid = !Object.values(errors).some(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ service: true, deployment: true, error: true });
    if (!isValid) return;
    setSubmitting(true);
    try {
      await onSubmit?.({
        service: form.service.trim(),
        severity: form.severity,
        deployment: form.deployment.trim(),
        error: form.error.trim(),
      });
      setForm(INITIAL);
      setTouched({});
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    setForm(INITIAL);
    setTouched({});
    onCancel?.();
  };

  const showError = (key) => touched[key] && errors[key];

  return (
    <section ref={ref} className="ni-card" aria-labelledby="ni-title">
      <header className="ni-head">
        <h2 id="ni-title">Trigger new incident</h2>
        <p>Add the details below and Hindsight will start investigating right away.</p>
      </header>

      <form className="ni-form" onSubmit={handleSubmit} noValidate>
        <div className="ni-field">
          <label htmlFor="ni-service">Service name</label>
          <input
            id="ni-service"
            ref={serviceInputRef}
            type="text"
            placeholder="e.g. checkout-service, auth-service"
            value={form.service}
            onChange={set("service")}
            onBlur={blur("service")}
            aria-invalid={!!showError("service")}
            aria-describedby={showError("service") ? "ni-service-err" : undefined}
          />
          {showError("service") && (
            <span id="ni-service-err" className="ni-error">{errors.service}</span>
          )}
        </div>

        <div className="ni-field">
          <label htmlFor="ni-deployment">Deployment tag</label>
          <input
            id="ni-deployment"
            type="text"
            placeholder="v1.0.0"
            value={form.deployment}
            onChange={set("deployment")}
            onBlur={blur("deployment")}
            aria-invalid={!!showError("deployment")}
            aria-describedby={showError("deployment") ? "ni-deployment-err" : undefined}
          />
          {showError("deployment") && (
            <span id="ni-deployment-err" className="ni-error">{errors.deployment}</span>
          )}
        </div>

        <fieldset className="ni-field ni-full">
          <legend>Severity</legend>
          <div className="ni-sev-group" role="radiogroup">
            {SEVERITIES.map((s) => (
              <label key={s.value} className={`ni-sev ni-sev-${s.value.toLowerCase()}`}>
                <input
                  type="radio"
                  name="severity"
                  value={s.value}
                  checked={form.severity === s.value}
                  onChange={set("severity")}
                />
                <span className="ni-sev-body">
                  <strong>{s.label}</strong>
                  <em>{s.hint}</em>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="ni-field ni-full">
          <label htmlFor="ni-error">Error / failure signal</label>
          <textarea
            id="ni-error"
            rows={5}
            placeholder={"e.g. MongoServerSelectionTimeoutError: connection timed out after 30000ms"}
            value={form.error}
            onChange={set("error")}
            onBlur={blur("error")}
            aria-invalid={!!showError("error")}
            aria-describedby={showError("error") ? "ni-error-err" : undefined}
          />
          {showError("error") && (
            <span id="ni-error-err" className="ni-error">{errors.error}</span>
          )}
        </div>

        <footer className="ni-actions ni-full">
          <button type="button" className="ni-btn ni-btn-ghost" onClick={handleCancelClick} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="ni-btn ni-btn-primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create and investigate"}
          </button>
        </footer>
      </form>
    </section>
  );
});

export default NewIncidentForm;
