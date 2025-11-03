import React from "react";
import "./Cancel-button.css";

export default function CancelButton() {
  const handleCancel = () => {
    // Get where the user came from (the referrer)
    const referrer = document.referrer;

    // ✅ Case 1: Came from dashboard
    if (referrer.includes("stochify.com/dashboard")) {
      window.location.href = "https://stochify.com/dashboard";
      return;
    }

    // ✅ Case 2: Came from anywhere on main site (homepage or other)
    if (referrer.includes("stochify.com")) {
      window.location.href = "https://stochify.com";
      return;
    }

    // ✅ Case 3: Fallback (if user came from outside or direct link)
    // Default to homepage
    window.location.href = "https://stochify.com";
  };

  return (
    <button className="cancel-button" onClick={handleCancel}>
      Cancel
    </button>
  );
}
