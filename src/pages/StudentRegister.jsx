
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_URL from "../api";

function StudentRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/students/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Registration failed. Please check your details."
        );
      }

      setMessage("Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/student-login");
      }, 1000);
    } catch (error) {
      setMessage(
        error.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="student-auth-page">
      <form
        className="student-auth-card"
        onSubmit={handleSubmit}
      >
        <Link to="/" className="student-auth-logo">
          Student<span className="student-auth-logo-accent">Ease</span>
        </Link>

        <div className="student-auth-icon">🎓</div>

        <h1>Create Student Account</h1>

        <p className="student-auth-subtitle">
          Register to access StudentEase.
        </p>

        <div className="student-auth-field">
          <label htmlFor="full_name">Full name</label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />
        </div>

        <div className="student-auth-field">
          <label htmlFor="email">College email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your college email"
            autoComplete="email"
            required
          />
        </div>

        <div className="student-auth-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label className="student-show-password">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) =>
                setShowPassword(event.target.checked)
              }
            />
            Show password
          </label>
        </div>

        {message && (
          <p className="student-auth-message" role="status">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="student-auth-button"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="student-auth-register">
          Already registered?{" "}
          <Link to="/student-login">Sign in</Link>
        </p>

        <Link to="/" className="student-auth-back">
          ← Back to Home
        </Link>

        <p className="student-auth-footer">
          StudentEase · Student Portal
        </p>
      </form>
    </main>
  );
}

export default StudentRegister;
