import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_URL from "../api";

function StudentLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/students/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed.");
      }

      sessionStorage.setItem(
        "studentease.studentToken",
        data.access_token,
      );

      sessionStorage.setItem(
        "studentease.student",
        JSON.stringify({
          id: data.student_id,
          full_name: data.full_name,
          email: data.email,
        }),
      );

      navigate("/student-dashboard");
    } catch (error) {
      setMessage(
        error.message || "Unable to connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="student-auth-page">
      <form className="student-auth-card" onSubmit={handleSubmit}>
        <Link to="/" className="student-auth-logo">
          <span className="student-auth-icon">✦</span>
          <span>
            Student<span className="student-auth-logo-accent">Ease</span>
          </span>
        </Link>

        <h1>Welcome Back!</h1>
        <p className="student-auth-subtitle">
          Your voice matters. Sign in to continue.
        </p>

        <div className="student-auth-field">
          <label htmlFor="student-email">College email</label>
          <input
            id="student-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your college email"
            autoComplete="username"
            required
          />
        </div>

        <div className="student-auth-field">
          <label htmlFor="student-password">Password</label>
          <input
            id="student-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        <label className="student-show-password">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(event) => setShowPassword(event.target.checked)}
          />
          Show password
        </label>

        {message && (
          <p className="student-auth-message" role="alert">
            {message}
          </p>
        )}

        <button
          className="student-auth-button"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="student-auth-register">
          New to StudentEase?{" "}
          <Link to="/student-register">Create an account</Link>
        </p>

        <Link to="/" className="student-auth-back">
          ← Back to Home
        </Link>

        <p className="student-auth-footer">
          StudentEase · A better campus experience
        </p>
      </form>
    </main>
  );
}

export default StudentLogin;