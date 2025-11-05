import { useState } from "react";
import { FaEye } from "react-icons/fa";
import { FaCode } from "react-icons/fa6";
import "./CodeVisualToggle.css";

export default function CodeVisualToggle({ mode, onToggle }) {
  const [current, setCurrent] = useState(mode || "visual");

  const handleToggle = (newMode) => {
    setCurrent(newMode);
    onToggle?.(newMode);
  };

  return (
    <div className="toggle-container">
      <button
        className={`toggle-btn ${current === "visual" ? "active" : ""}`}
        onClick={() => handleToggle("visual")}
        title="Show Visual"
      >
        <FaEye />
      </button>
      <button
        className={`toggle-btn ${current === "code" ? "active" : ""}`}
        onClick={() => handleToggle("code")}
        title="Show Code"
      >
        <FaCode />
      </button>
    </div>
  );
}
