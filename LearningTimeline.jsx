import "./LearningTimeline.css";

function LearningTimeline({ onBack, learnedMemory }) {
  return (
    <main className="learning-page">

      {/* HEADER */}

      <div className="learning-header">

        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>

        <div>
          <h1>Hindsight Learning</h1>

          <p>
            See how incident outcomes become knowledge
            for future investigations.
          </p>
        </div>

      </div>


      {/* NEW MEMORY */}

      {learnedMemory && (
        <section className="new-memory-card">

          <div className="new-memory-icon">
            ✓
          </div>

          <div className="new-memory-content">

            <span>
              NEW MEMORY RETAINED
            </span>

            <h2>
              {learnedMemory.incidentId} —{" "}
              {learnedMemory.service}
            </h2>

            <p>
              Engineer decision:{" "}
              <strong>
                {learnedMemory.decision}
              </strong>
            </p>

            <p>
              Actual outcome:{" "}
              <strong>
                {learnedMemory.outcome}
              </strong>
            </p>

            {learnedMemory.comment && (
              <p>
                Engineer note:{" "}
                <strong>
                  {learnedMemory.comment}
                </strong>
              </p>
            )}

          </div>

          <div className="retained-badge">
            Retained
          </div>

        </section>
      )}


      {/* LEARNING LOOP */}

      <section className="learning-card">

        <div className="learning-card-header">

          <div>

            <span className="eyebrow">
              HINDSIGHT LEARNING LOOP
            </span>

            <h2>
              From incident to future knowledge
            </h2>

          </div>

        </div>


        <div className="learning-flow">

          <div className="learning-step">

            <span className="step-circle">
              01
            </span>

            <strong>
              Incident
            </strong>

            <p>
              Current system failure is captured.
            </p>

          </div>


          <div className="flow-arrow">
            →
          </div>


          <div className="learning-step">

            <span className="step-circle">
              02
            </span>

            <strong>
              Hindsight Recall
            </strong>

            <p>
              Similar historical incidents are recalled.
            </p>

          </div>


          <div className="flow-arrow">
            →
          </div>


          <div className="learning-step">

            <span className="step-circle">
              03
            </span>

            <strong>
              AI Recommendation
            </strong>

            <p>
              Historical outcomes influence reasoning.
            </p>

          </div>


          <div className="flow-arrow">
            →
          </div>


          <div className="learning-step">

            <span className="step-circle">
              04
            </span>

            <strong>
              Engineer Feedback
            </strong>

            <p>
              Human decision and outcome are captured.
            </p>

          </div>


          <div className="flow-arrow">
            →
          </div>


          <div className="learning-step">

            <span className="step-circle">
              05
            </span>

            <strong>
              Retain
            </strong>

            <p>
              The outcome becomes future memory.
            </p>

          </div>

        </div>

      </section>


      {/* TIMELINE */}

      <section className="timeline-card">

        <div className="timeline-heading">

          <div>

            <span className="eyebrow">
              RECENT LEARNING ACTIVITY
            </span>

            <h2>
              Memory evolution
            </h2>

          </div>

        </div>


        <div className="timeline">

          <div className="timeline-item">

            <div className="timeline-dot">
              ✓
            </div>

            <div className="timeline-content">

              <span>
                JUST NOW
              </span>

              <h3>
                INC-104 feedback retained
              </h3>

              <p>
                Payment API incident outcome
                added to Hindsight memory.
              </p>

            </div>

          </div>


          <div className="timeline-item">

            <div className="timeline-dot">
              ✓
            </div>

            <div className="timeline-content">

              <span>
                TODAY
              </span>

              <h3>
                INC-103 authentication pattern learned
              </h3>

              <p>
                Engineer resolution was retained
                after successful incident recovery.
              </p>

            </div>

          </div>


          <div className="timeline-item">

            <div className="timeline-dot">
              ✓
            </div>

            <div className="timeline-content">

              <span>
                YESTERDAY
              </span>

              <h3>
                Network configuration pattern updated
              </h3>

              <p>
                Historical outcomes improved the
                context available for future recommendations.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* STATS */}

      <div className="learning-stats">

        <div>
          <span>
            Total Memories
          </span>

          <strong>
            {learnedMemory ? "129" : "128"}
          </strong>
        </div>


        <div>
          <span>
            Successful Outcomes
          </span>

          <strong>
            117
          </strong>
        </div>


        <div>
          <span>
            Patterns Learned
          </span>

          <strong>
            42
          </strong>
        </div>


        <div>
          <span>
            Feedback Signals
          </span>

          <strong>
            {learnedMemory ? "96" : "95"}
          </strong>
        </div>

      </div>

    </main>
  );
}

export default LearningTimeline;