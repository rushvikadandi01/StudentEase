import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SubmitComplaint.css";
import API_URL from "../api";

function SubmitComplaint() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Let AI detect");
  const [anonymous, setAnonymous] = useState(false);

const analyzeComplaint = async () => {
  if (!title.trim() || !description.trim()) {
    alert("Please enter a complaint title and description.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/complaints`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || "Not specified",
        category,
        anonymous,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }

    const result = await response.json();

    const complaintData = {
      ...result,
      id: `CP-${Date.now().toString().slice(-6)}`,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    const existingComplaints = JSON.parse(
      localStorage.getItem("studentease.complaints") || "[]"
    );

    localStorage.setItem(
      "studentease.complaints",
      JSON.stringify([complaintData, ...existingComplaints])
    );

    navigate("/analysis", {
      state: complaintData,
    });
  } catch (error) {
    console.error("Complaint submission failed:", error);
    alert(
      "Could not analyze your complaint. Please make sure the StudentEase backend is running and try again."
    );
  }
};
  return (
    <div className="complaint-page">

      {/* Header */}
      <header className="complaint-header">
        <div className="complaint-logo">
          Student<span>Ease</span>
        </div>

        <button className="back-btn">
          ← Back to Home
        </button>
      </header>

      {/* Main Content */}
      <main className="complaint-container">

        {/* Introduction */}
        <div className="complaint-intro">
          <p className="page-label">STUDENT SUPPORT</p>

          <h1>
            Submit a <span>Complaint</span>
          </h1>

          <p>
            Tell us about your issue. Our AI will analyze your complaint
            and automatically determine its category and priority.
          </p>
        </div>

        {/* Complaint Form */}
        <div className="complaint-card">

          {/* Complaint Title */}
          <div className="form-group">
            <label>Complaint Title</label>

            <input
              type="text"
              placeholder="Example: Wi-Fi not working in hostel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Describe your issue</label>

            <textarea
              rows="6"
              placeholder="Please explain your complaint in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          {/* Location + Category */}
          <div className="form-row">

            {/* Location */}
            <div className="form-group">
              <label>Location</label>

              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Select location</option>
                <option value="Hostel">Hostel</option>
                <option value="Classroom">Classroom</option>
                <option value="Library">Library</option>
                <option value="Canteen">Canteen</option>
                <option value="Campus">Campus</option>
                <option value="Transport">Transport</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Category */}
            <div className="form-group">
              <label>Category</label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Let AI detect">Let AI detect</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Hostel">Hostel</option>
                <option value="Academics">Academics</option>
                <option value="IT / Internet">IT / Internet</option>
                <option value="Transport">Transport</option>
                <option value="Cleanliness">Cleanliness</option>
                <option value="Security">Security</option>
                <option value="Other">Other</option>
              </select>
            </div>

          </div>

          {/* Anonymous Option */}
          <div className="anonymous-option">

            <input
              type="checkbox"
              id="anonymous"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />

            <label htmlFor="anonymous">
              Submit this complaint anonymously
            </label>

          </div>

          {/* Submit Button */}
          <button
            className="analyze-btn"
            onClick={analyzeComplaint}
          >
            ✦ Analyze & Submit Complaint
          </button>

          {/* Note */}
          <p className="form-note">
            Your complaint will be analyzed using AI before being
            forwarded to the appropriate department.
          </p>

        </div>

      </main>

    </div>
  );
}

export default SubmitComplaint;