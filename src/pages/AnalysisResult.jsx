import { useLocation, useNavigate } from "react-router-dom";
import "./AnalysisResult.css";

function AnalysisResult() {
  const routeLocation = useLocation();
  const navigate = useNavigate();

  // Receive the backend analysis from SubmitComplaint.jsx
  const complaint = routeLocation.state || {
    title: "",
    description: "",
    location: "",
    category: "Let AI detect",
    anonymous: false,
  };

  const isValidComplaint =
    Boolean(routeLocation.state?.title) &&
    Boolean(routeLocation.state?.description);

  // Use the results returned by FastAPI
  const category = complaint.category || "General Complaint";
  const priority = complaint.priority || "LOW";
  const sentiment = complaint.sentiment || "Neutral";
  const department = complaint.department || "Student Affairs";
  const complaintId = complaint.id || "Not assigned";

  if (!isValidComplaint) {
    return (
      <div className="analysis-page">
        <header className="analysis-header">
          <div className="analysis-logo">
            Student<span>Ease</span>
          </div>

          <button
            className="back-btn"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>
        </header>

        <main className="analysis-container">
          <div className="result-card">
            <h2>No complaint data found</h2>
            <p className="original-text">
              Please submit a complaint before viewing its analysis.
            </p>

            <button
              className="dashboard-btn"
              onClick={() => navigate("/submit-complaint")}
            >
              Submit a Complaint →
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="analysis-page">
      {/* Header */}
      <header className="analysis-header">
        <div className="analysis-logo">
          Student<span>Ease</span>
        </div>

        <button
          className="back-btn"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>
      </header>

      {/* Main */}
      <main className="analysis-container">
        <div className="analysis-intro">
          <div className="success-icon">✓</div>

          <p className="page-label">
            COMPLAINT ANALYSIS COMPLETE
          </p>

          <h1>
            Your complaint has been <span>analyzed.</span>
          </h1>

          <p>
            Your complaint has been analyzed by the StudentEase
            backend. Review the category, priority, sentiment,
            and suggested department below.
          </p>
        </div>

        {/* Complaint ID */}
        <div className="complaint-id">
          Complaint ID: <strong>{complaintId}</strong>
        </div>

        {/* Original Complaint */}
        <div className="result-card">
          <div className="result-title">
            <span>YOUR COMPLAINT</span>
          </div>

          <h2>{complaint.title}</h2>

          <p className="original-text">
            {complaint.description}
          </p>

          <div className="complaint-meta">
            <span>
              Location:{" "}
              <strong>
                {complaint.location || "Not specified"}
              </strong>
            </span>

            <span>
              Selected category:{" "}
              <strong>
                {complaint.category || "Let AI detect"}
              </strong>
            </span>

            <span>
              Anonymous:{" "}
              <strong>
                {complaint.anonymous ? "Yes" : "No"}
              </strong>
            </span>
          </div>
        </div>

        {/* Backend Analysis Results */}
        <div className="result-grid">
          <div className="result-box">
            <p>CATEGORY</p>
            <h3>{category}</h3>
            <span className="result-description">
              Returned by the backend
            </span>
          </div>

          <div className="result-box priority-box">
            <p>PRIORITY</p>

            <h3
              className={
                priority === "HIGH"
                  ? "high-priority"
                  : priority === "MEDIUM"
                    ? "medium-priority"
                    : "low-priority"
              }
            >
              {priority}
            </h3>

            <span className="result-description">
              Backend priority assessment
            </span>
          </div>

          <div className="result-box">
            <p>SENTIMENT</p>
            <h3>{sentiment}</h3>
            <span className="result-description">
              Backend sentiment assessment
            </span>
          </div>

          <div className="result-box">
            <p>SUGGESTED DEPARTMENT</p>
            <h3>{department}</h3>
            <span className="result-description">
              Department returned by the backend
            </span>
          </div>
        </div>

        
{/* Backend Notice */}
<div className="status-card">
  <div className="status-icon">i</div>

  <div>
    <h3>AI-powered analysis complete</h3>
    <p>
      Your complaint was analyzed by the StudentEase
      backend using a trained machine-learning model
      for category classification. Priority and sentiment
      are assessed using keyword-based rules, and the
      suggested department is assigned based on the
      detected category. Submitted complaints are saved
      in the backend SQLite database.
    </p>
  </div>
</div>


        {/* Actions */}
        <button
          className="dashboard-btn"
          onClick={() => navigate("/my-complaints")}
        >
          Go to My Complaints →
        </button>
      </main>
    </div>
  );
}

export default AnalysisResult;