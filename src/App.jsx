import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";

import SubmitComplaint from "./pages/SubmitComplaint";
import AnalysisResult from "./pages/AnalysisResult";
import MyComplaints from "./pages/MyComplaints";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import StudentDashboard from "./pages/StudentDashboard";

function Home() {
  const studentToken = sessionStorage.getItem("studentease.studentToken");
  const student = sessionStorage.getItem("studentease.student");
  const isLoggedIn = Boolean(studentToken && student);

  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="logo">
          Student<span>Ease</span>
        </Link>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About</a>

          {isLoggedIn ? (
            <>
              <Link to="/my-complaints">My Complaints</Link>
              <Link to="/student-dashboard">Dashboard</Link>
            </>
          ) : (
            <>
              <Link to="/student-login">Student Login</Link>
              <Link to="/student-register">Register</Link>
            </>
          )}
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="tagline">
            SMARTER CAMPUS • BETTER EXPERIENCE
          </p>

          <h1>
            Your Voice.
            <br />
            <span>Our Priority.</span>
          </h1>

          <p className="hero-text">
            Submit your college complaints and let AI analyze
            complaint text to help categorize and prioritize issues.
          </p>

          <div className="hero-buttons">
            {isLoggedIn ? (
              <Link
                to="/student-dashboard"
                className="primary-btn"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <Link
                to="/student-login"
                className="primary-btn"
              >
                Student Login →
              </Link>
            )}
          </div>
        </div>

        <div className="ai-card">
          <div className="card-header">
            <div>
              <p className="small-text">AI ANALYSIS</p>
              <h3>Complaint Analysis</h3>
            </div>
            <div className="ai-icon">✦</div>
          </div>

          <div className="complaint-box">
            <p>
              "The Wi-Fi has not been working in the hostel for the
              past two days."
            </p>
          </div>

          <div className="analysis">
            <div>
              <span>Category</span>
              <strong>IT / Internet</strong>
            </div>
            <div>
              <span>Priority</span>
              <strong className="high">Predicted result</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <p className="section-label">HOW IT WORKS</p>
        <h2>
          Complaints made<span> easier.</span>
        </h2>

        <div className="steps">
          <div className="step">
            <div className="step-number">01</div>
            <h3>Submit</h3>
            <p>Tell us about your issue in simple words.</p>
          </div>

          <div className="step">
            <div className="step-number">02</div>
            <h3>AI Analyzes</h3>
            <p>
              The system analyzes the complaint and provides its
              available predictions.
            </p>
          </div>

          <div className="step">
            <div className="step-number">03</div>
            <h3>Track</h3>
            <p>
              Review your submitted complaints and check their
              recorded status.
            </p>
          </div>
        </div>
      </section>

      <section className="how-section" id="about">
        <p className="section-label">ABOUT STUDENTEASE</p>
        <h2>
          A better way to make your <span>voice heard.</span>
        </h2>
        <p className="hero-text">
          StudentEase helps students submit campus complaints,
          view complaint analysis, and track their submissions.
        </p>
      </section>
    </div>
  );
}

function RequireStudent({ children }) {
  const token = sessionStorage.getItem("studentease.studentToken");
  const student = sessionStorage.getItem("studentease.student");

  if (!token || !student) {
    return <Navigate to="/student-login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/student-login"
          element={<StudentLogin />}
        />

        <Route
          path="/student-register"
          element={<StudentRegister />}
        />

        <Route
          path="/student-dashboard"
          element={
            <RequireStudent>
              <StudentDashboard />
            </RequireStudent>
          }
        />

        <Route
          path="/submit-complaint"
          element={
            <RequireStudent>
              <SubmitComplaint />
            </RequireStudent>
          }
        />

        <Route
          path="/analysis"
          element={
            <RequireStudent>
              <AnalysisResult />
            </RequireStudent>
          }
        />

        <Route
          path="/my-complaints"
          element={
            <RequireStudent>
              <MyComplaints />
            </RequireStudent>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;