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
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";

function Home() {
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
          <Link to="/my-complaints">My Complaints</Link>
          <Link to="/login" className="login-btn">
            Admin Login
          </Link>
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
            Submit your college complaints and let AI automatically
            understand, categorize, and prioritize them.
          </p>

          
          <div className="hero-buttons">
             <Link to="/submit-complaint" className="primary-btn">
             Submit a Complaint →
            </Link>
          </div>

        </div>

        <div className="ai-card">
          <div className="card-header">
            <div>
              <p className="small-text">AI ANALYSIS</p>
              <h3>Complaint Priority</h3>
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
              <strong className="high">HIGH</strong>
            </div>
            <div>
              <span>Confidence</span>
              <strong>94%</strong>
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
            <p>Our system categorizes and prioritizes your complaint.</p>
          </div>

          <div className="step">
            <div className="step-number">03</div>
            <h3>Get Resolved</h3>
            <p>The right department receives and handles it.</p>
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
          understand their priority, and track their status.
        </p>
      </section>
    </div>
  );
}

function RequireAdmin({ children }) {
  const token = sessionStorage.getItem("studentease.adminToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/submit-complaint"
          element={<SubmitComplaint />}
        />

        <Route path="/analysis" element={<AnalysisResult />} />

        <Route
          path="/my-complaints"
          element={<MyComplaints />}
        />

        <Route path="/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;