import "./BeforeAfter.css";

function BeforeAfter({ onBack }) {
  return (
    <main className="before-after-page">

      <button className="before-back" onClick={onBack}>
        ← Dashboard
      </button>

      <div className="before-header">
        <div>
          <span className="before-eyebrow">
            HINDSIGHT LEARNING
          </span>

          <h1>Before vs After Hindsight</h1>

          <p>
            See how incident knowledge improves future
            investigations and recommendations.
          </p>
        </div>

        <div className="learning-status">
          <span className="status-dot"></span>
          Learning Loop Active
        </div>
      </div>


      {/* Comparison */}

      <section className="comparison-grid">

        {/* BEFORE */}

        <div className="comparison-card before-card">

          <div className="comparison-heading">
            <div className="comparison-icon">
              ?
            </div>

            <div>
              <span>BEFORE HINDSIGHT</span>

              <h2>
                Limited Context
              </h2>
            </div>
          </div>


          <div className="comparison-item">
            <span>01</span>

            <div>
              <strong>
                Current incident only
              </strong>

              <p>
                Investigation starts with logs,
                metrics and current system evidence.
              </p>
            </div>
          </div>


          <div className="comparison-item">
            <span>02</span>

            <div>
              <strong>
                No historical outcome context
              </strong>

              <p>
                Engineers must manually search previous
                incidents and resolutions.
              </p>
            </div>
          </div>


          <div className="comparison-item">
            <span>03</span>

            <div>
              <strong>
                Generic recommendations
              </strong>

              <p>
                AI reasoning has limited knowledge of
                what previously worked for the team.
              </p>
            </div>
          </div>


          <div className="comparison-result before-result">
            <span>INVESTIGATION TIME</span>

            <strong>
              47 min
            </strong>

            <small>
              Average investigation
            </small>
          </div>

        </div>


        {/* AFTER */}

        <div className="comparison-card after-card">

          <div className="comparison-heading">
            <div className="comparison-icon">
              ✓
            </div>

            <div>
              <span>AFTER HINDSIGHT</span>

              <h2>
                Learned Context
              </h2>
            </div>
          </div>


          <div className="comparison-item">
            <span>01</span>

            <div>
              <strong>
                Current evidence + memory
              </strong>

              <p>
                The system combines the active incident
                with relevant historical memories.
              </p>
            </div>
          </div>


          <div className="comparison-item">
            <span>02</span>

            <div>
              <strong>
                Historical outcomes recalled
              </strong>

              <p>
                Previous root causes, actions and actual
                outcomes influence the investigation.
              </p>
            </div>
          </div>


          <div className="comparison-item">
            <span>03</span>

            <div>
              <strong>
                Outcome-aware recommendations
              </strong>

              <p>
                Engineer feedback is retained so future
                recommendations can improve.
              </p>
            </div>
          </div>


          <div className="comparison-result after-result">
            <span>INVESTIGATION TIME</span>

            <strong>
              18 min
            </strong>

            <small>
              Average investigation
            </small>
          </div>

        </div>

      </section>


      {/* Learning Transformation */}

      <section className="transformation-card">

        <div className="transformation-header">

          <div>
            <span>
              THE LEARNING TRANSFORMATION
            </span>

            <h2>
              One incident becomes future knowledge
            </h2>

            <p>
              Hindsight doesn't stop at generating a
              recommendation. The actual engineer decision
              and incident outcome are retained for future
              investigations.
            </p>
          </div>

        </div>


        <div className="transformation-flow">

          <div className="transform-node">

            <div className="transform-number">
              01
            </div>

            <strong>
              Incident
            </strong>

            <span>
              Payment API failure
            </span>

          </div>


          <div className="transform-arrow">
            →
          </div>


          <div className="transform-node">

            <div className="transform-number">
              02
            </div>

            <strong>
              Recall
            </strong>

            <span>
              Similar historical incidents
            </span>

          </div>


          <div className="transform-arrow">
            →
          </div>


          <div className="transform-node">

            <div className="transform-number">
              03
            </div>

            <strong>
              Recommend
            </strong>

            <span>
              Roll back configuration
            </span>

          </div>


          <div className="transform-arrow">
            →
          </div>


          <div className="transform-node">

            <div className="transform-number">
              04
            </div>

            <strong>
              Engineer Feedback
            </strong>

            <span>
              Actual resolution captured
            </span>

          </div>


          <div className="transform-arrow">
            →
          </div>


          <div className="transform-node learned-node">

            <div className="transform-number">
              05
            </div>

            <strong>
              Hindsight Memory
            </strong>

            <span>
              Available for future incidents
            </span>

          </div>

        </div>

      </section>


      {/* Impact */}

      <section className="before-impact">

        <div className="impact-stat">
          <span>
            WITHOUT HINDSIGHT
          </span>

          <strong>
            47 min
          </strong>

          <small>
            Average investigation time
          </small>
        </div>


        <div className="impact-divider">
          ↓
        </div>


        <div className="impact-stat highlight">
          <span>
            WITH HINDSIGHT
          </span>

          <strong>
            18 min
          </strong>

          <small>
            Average investigation time
          </small>
        </div>


        <div className="impact-stat">
          <span>
            MEMORIES LEARNED
          </span>

          <strong>
            128+
          </strong>

          <small>
            Organizational knowledge
          </small>
        </div>

      </section>

    </main>
  );
}

export default BeforeAfter;