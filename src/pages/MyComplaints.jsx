import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyComplaints.css";
import API_URL from "../api";

function MyComplaints() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load complaints from the backend
  useEffect(() => {
    async function loadComplaints() {
      try {
       const token = sessionStorage.getItem("studentease.studentToken");

const response = await fetch(`${API_URL}/students/my-complaints`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

        if (!response.ok) {
          throw new Error("Failed to load complaints.");
        }

        const savedComplaints = await response.json();
        setComplaints(savedComplaints);
      } catch (error) {
        console.error("Could not load complaints:", error);

        alert(
          "Could not load complaints. Please check that the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadComplaints();
  }, []);

  // Summary counts
  const pendingCount = complaints.filter(
    (item) => item.status === "Pending"
  ).length;

  const inProgressCount = complaints.filter(
    (item) => item.status === "In Progress"
  ).length;

  const resolvedCount = complaints.filter(
    (item) => item.status === "Resolved"
  ).length;

  // Format submitted date
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "Date unavailable"
      : parsedDate.toLocaleString();
  };

  return (
    <div className="my-complaints-page">
      <header className="history-header">
        <div className="analysis-logo">
          Student<span>Ease</span>
        </div>

        <button
          className="back-btn"
          onClick={() => navigate("/")}
        >
          ← Home
        </button>
      </header>

      <main className="history-container">
        <div className="history-intro">
          <p className="page-label">STUDENT DASHBOARD</p>

          <h1>
            My <span>Complaints</span>
          </h1>

          <p>
            Track and review the complaints you have submitted.
          </p>
        </div>

        {/* Summary */}
        <div className="history-summary">
          <div>
            <p>TOTAL COMPLAINTS</p>
            <h2>{complaints.length}</h2>
          </div>

          <div>
            <p>PENDING</p>
            <h2>{pendingCount}</h2>
          </div>

          <div>
            <p>IN PROGRESS</p>
            <h2>{inProgressCount}</h2>
          </div>

          <div>
            <p>RESOLVED</p>
            <h2>{resolvedCount}</h2>
          </div>
        </div>

        {/* Complaint List Header */}
        <div className="history-list-header">
          <h2>Recent Complaints</h2>

          <button
            className="new-complaint-btn"
            onClick={() => navigate("/submit-complaint")}
          >
            + New Complaint
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="empty-history">
            <h3>Loading complaints...</h3>
          </div>
        ) : complaints.length === 0 ? (
          /* Empty State */
          <div className="empty-history">
            <div className="empty-icon">☰</div>

            <h3>No complaints yet</h3>

            <p>
              Your submitted complaints will appear here.
            </p>

            <button
              className="new-complaint-btn"
              onClick={() => navigate("/submit-complaint")}
            >
              Submit Your First Complaint →
            </button>
          </div>
        ) : (
          /* Complaint Cards */
          <div className="history-list">
            {complaints.map((item, index) => (
              <article
                className="history-card"
                key={item.id || `${item.title}-${index}`}
              >
                <div className="history-card-top">
                  <span className="history-id">
                    {item.id || "ID unavailable"}
                  </span>

                  <span
                    className={`status-badge ${
                      (item.status || "Pending")
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                    }`}
                  >
                    {item.status || "Pending"}
                  </span>
                </div>

                {/* Complaint Details */}
                <h3>{item.title}</h3>

                <p className="history-description">
                  {item.description}
                </p>

                <div className="history-details">
                  <span>
                    Category:{" "}
                    <strong>
                      {item.category || "Not assigned"}
                    </strong>
                  </span>

                  <span>
                    Location:{" "}
                    <strong>
                      {item.location || "Not specified"}
                    </strong>
                  </span>

                  <span>
                    Priority:{" "}
                    <strong
                      className={
                        String(item.priority || "").toUpperCase() ===
                        "HIGH"
                          ? "high-priority"
                          : String(item.priority || "").toUpperCase() ===
                              "MEDIUM"
                            ? "medium-priority"
                            : String(item.priority || "").toUpperCase() ===
                                "LOW"
                              ? "low-priority"
                              : ""
                      }
                    >
                      {item.priority || "Not assigned"}
                    </strong>
                  </span>

                  <span>
                    Department:{" "}
                    <strong>
                      {item.department || "Not assigned"}
                    </strong>
                  </span>

                  <span>
                    Anonymous:{" "}
                    <strong>
                      {item.anonymous ? "Yes" : "No"}
                    </strong>
                  </span>
                </div>

                <div className="history-card-bottom">
                  <span>
                    Submitted:{" "}
                    {formatDate(item.createdAt || item.created_at)}
                  </span>

                  <button
                    className="view-complaint-btn"
                    onClick={() =>
                      navigate("/analysis", {
                        state: item,
                      })
                    }
                  >
                    View Analysis →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyComplaints;