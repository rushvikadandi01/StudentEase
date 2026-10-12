
import { Link, useNavigate } from "react-router-dom";

function StudentDashboard() {
  const navigate = useNavigate();

  const studentToken = sessionStorage.getItem(
    "studentease.studentToken"
  );

  const savedStudent = sessionStorage.getItem(
    "studentease.student"
  );

  // Require a student login
  if (!studentToken || !savedStudent) {
    navigate("/student-login", { replace: true });
    return null;
  }

  let student;

  try {
    student = JSON.parse(savedStudent);
  } catch {
    sessionStorage.removeItem("studentease.student");
    sessionStorage.removeItem("studentease.studentToken");
    navigate("/student-login", { replace: true });
    return null;
  }

  function handleLogout() {
    sessionStorage.removeItem("studentease.studentToken");
    sessionStorage.removeItem("studentease.student");
    navigate("/student-login", { replace: true });
  }

  return (
    <div className="student-dashboard">
      <header className="student-dashboard-header">
        <Link to="/" className="student-dashboard-brand">
          StudentEase
        </Link>

        <div className="student-dashboard-profile">
          <span>{student.full_name}</span>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="student-dashboard-main">
        <section className="student-dashboard-welcome">
          <p className="student-dashboard-eyebrow">
            STUDENT PORTAL
          </p>

          <h1>
            Welcome back, {student.full_name}! 👋
          </h1>

          <p>
            Manage your campus complaints and stay updated
            on their progress.
          </p>
        </section>

        <section className="student-dashboard-account">
          <h2>Your Account</h2>
          <p>
            <strong>Name:</strong> {student.full_name}
          </p>
          <p>
            <strong>Email:</strong> {student.email}
          </p>
          <p>
            <strong>Student ID:</strong> {student.id}
          </p>
        </section>

        <section className="student-dashboard-section">
          <h2>Quick Actions</h2>

          <div className="student-dashboard-grid">
            <Link
              to="/submit-complaint"
              className="student-dashboard-card"
            >
              <span className="student-dashboard-icon">
                <span aria-hidden="true">📝</span>
              </span>

              <h3>Submit a Complaint</h3>

              <p>
                Report a campus issue so it can be reviewed.
              </p>

              <span className="student-dashboard-action">
                Submit complaint →
              </span>
            </Link>

            <Link
              to="/my-complaints"
              className="student-dashboard-card"
            >
              <span className="student-dashboard-icon">
                <span aria-hidden="true">📋</span>
              </span>

              <h3>My Complaints</h3>

              <p>
                Visit your complaints page to check updates.
              </p>

              <span className="student-dashboard-action">
                View complaints →
              </span>
            </Link>

            <Link
              to="/"
              className="student-dashboard-card"
            >
              <span className="student-dashboard-icon">
                <span aria-hidden="true">🏠</span>
              </span>

              <h3>Home</h3>

              <p>
                Return to the StudentEase homepage.
              </p>

              <span className="student-dashboard-action">
                Go to home →
              </span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
