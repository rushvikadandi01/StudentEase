import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API_URL from "../api";
const TOKEN_KEY = "studentease.adminToken";

function AdminDashboard() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const handleUnauthorized = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    navigate("/login", { replace: true });
  }, [navigate]);

  const fetchComplaints = useCallback(async () => {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/complaints`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error("Could not load complaints.");
      }

      const data = await response.json();
      setComplaints(data);
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the backend. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

 useEffect(() => {
  const controller = new AbortController();

  async function loadComplaints() {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/admin/complaints`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error("Could not load complaints.");
      }

      const data = await response.json();
      setComplaints(data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(
          err.message ||
            "Could not connect to the backend. Make sure FastAPI is running."
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  loadComplaints();

  return () => controller.abort();
}, [handleUnauthorized]);

  async function updateStatus(id, newStatus) {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/complaints/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Status update failed."
        );
      }

      setComplaints((current) =>
        current.map((complaint) =>
          complaint.id === id
            ? { ...complaint, status: newStatus }
            : complaint
        )
      );
    } catch (err) {
      alert(err.message || "Could not update status.");
      await fetchComplaints();
    }
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    navigate("/login", { replace: true });
  }

  // Search and filters
  const filteredComplaints = complaints.filter((complaint) => {
    const searchText = search.toLowerCase();

    const matchesSearch = [
      complaint.id,
      complaint.title,
      complaint.description,
      complaint.location,
      complaint.department,
    ].some((value) =>
      String(value || "").toLowerCase().includes(searchText)
    );

    const matchesStatus =
      statusFilter === "All" ||
      complaint.status === statusFilter;

    const matchesPriority =
      priorityFilter === "All" ||
      String(complaint.priority || "").toUpperCase() ===
        priorityFilter.toUpperCase();

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Dashboard summary
  const pending = complaints.filter(
    (complaint) => complaint.status === "Pending"
  ).length;

  const inProgress = complaints.filter(
    (complaint) => complaint.status === "In Progress"
  ).length;

  const resolved = complaints.filter(
    (complaint) => complaint.status === "Resolved"
  ).length;

  const highPriority = complaints.filter(
    (complaint) =>
      String(complaint.priority || "").toUpperCase() === "HIGH"
  ).length;

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "20px",
  };

  const selectStyle = {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#ffffff",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f8fc",
        padding: "32px",
        color: "#172033",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "28px",
        }}
      >
        <div>
          <p
            style={{
              color: "#6256d9",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            STUDENTEASE · ADMIN
          </p>

          <h1 style={{ margin: 0 }}>
            Complaint Dashboard
          </h1>

          <p style={{ color: "#64748b" }}>
            Review complaints and manage their status.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchComplaints}
            style={{
              ...selectStyle,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ↻ Refresh
          </button>

          <button
            onClick={logout}
            style={{
              ...selectStyle,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}

      {/* Summary Cards */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {[
          ["Total Complaints", complaints.length, "#6256d9"],
          ["Pending", pending, "#d97706"],
          ["In Progress", inProgress, "#2563eb"],
          ["Resolved", resolved, "#15803d"],
          ["High Priority", highPriority, "#dc2626"],
        ].map(([label, value, color]) => (
          <article key={label} style={cardStyle}>
            <p style={{ color: "#64748b", marginTop: 0 }}>
              {label}
            </p>

            <h2
              style={{
                color,
                fontSize: "30px",
                marginBottom: 0,
              }}
            >
              {value}
            </h2>
          </article>
        ))}
      </section>

      {/* Complaints Table */}
      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>All Complaints</h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <input
            aria-label="Search complaints"
            placeholder="Search by ID, title, location..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              ...selectStyle,
              flex: "1 1 240px",
            }}
          />

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            style={selectStyle}
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value)
            }
            style={selectStyle}
          >
            <option value="All">All priorities</option>
            <option value="HIGH">High priority</option>
            <option value="MEDIUM">Medium priority</option>
            <option value="LOW">Low priority</option>
          </select>
        </div>

        {loading ? (
          <p>Loading complaints...</p>
        ) : filteredComplaints.length === 0 ? (
          <p>No complaints match your filters.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                minWidth: "760px",
              }}
            >
              <thead>
                <tr style={{ background: "#f1f3f9" }}>
                  {[
                    "Complaint",
                    "Category",
                    "Priority",
                    "Department",
                    "Status",
                    "Update Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "14px",
                        fontSize: "13px",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredComplaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px",
                        maxWidth: "260px",
                      }}
                    >
                      <strong>
                        {complaint.title || "Untitled complaint"}
                      </strong>

                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        {complaint.id}
                      </p>

                      <p style={{ fontSize: "13px" }}>
                        {complaint.location ||
                          "Location not specified"}
                      </p>

                      <p style={{ fontSize: "13px" }}>
                        {complaint.description}
                      </p>
                    </td>

                    <td style={{ padding: "14px" }}>
                      {complaint.category || "Uncategorized"}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {complaint.priority || "Not set"}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {complaint.department || "Unassigned"}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {complaint.status || "Pending"}
                    </td>

                    <td style={{ padding: "14px" }}>
                      <select
                        aria-label={`Update status for ${complaint.id}`}
                        value={complaint.status || "Pending"}
                        onChange={(event) =>
                          updateStatus(
                            complaint.id,
                            event.target.value
                          )
                        }
                        style={selectStyle}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;