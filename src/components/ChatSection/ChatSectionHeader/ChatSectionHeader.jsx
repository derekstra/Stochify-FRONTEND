// ChatSectionHeader.jsx
import { LuSquarePen } from "react-icons/lu";
import { MdOutlineTipsAndUpdates } from "react-icons/md";
import "./ChatSectionHeader.css";
import { useState } from "react";

export default function ChatSectionHeader({ onNewChat }) {
  const [showTips, setShowTips] = useState(false);

  return (
    <div className="chat-header">
      {/* Left: Logo (reloads to stochify.com) */}
      <div className="chat-header-left">
        <a href="https://stochify.com" className="logo-link">
          <img src="/logo.png" alt="Stochify Logo" className="chat-logo" />
        </a>
      </div>

      {/* Center: Title */}
      <div className="chat-header-center">
        <h1 className="chat-title">Stochify</h1>
      </div>

      {/* Right: Tips + New Chat */}
      <div className="chat-header-right">
        <div
          className="tips-wrapper"
          onMouseEnter={() => setShowTips(true)}
          onMouseLeave={() => setShowTips(false)}
        >
          <MdOutlineTipsAndUpdates className="tips-icon" />
          {showTips && (
            <div className="tips-dropdown">
              <h4>💡 How to write good prompts</h4>
              <p>
                A good prompt tells <strong>exactly what you want to see</strong> — what to visualize,
                how to display it, and any mathematical or physical details that matter.
                The more context you give, the more precise the visualization.
              </p>

              <ul>
                <li>
                  <strong>Be specific:</strong> Name variables, functions, or systems clearly. Example: say{" "}
                  <code>sin(x) * cos(y)</code> instead of “a wavy surface.”
                </li>
                <li>
                  <strong>Choose the dimension:</strong> Tell whether you want a <strong>2D</strong> or{" "}
                  <strong>3D</strong> visualization — e.g. “Plot in 2D” or “Show a 3D surface.”
                </li>
                <li>
                  <strong>Mention parameters:</strong> Include constants, ranges, or labels — like{" "}
                  <code>x from -5 to 5</code> or <code>amplitude = 2</code>.
                </li>
                <li>
                  <strong>Describe the style:</strong> Specify tone — e.g., “minimal,” “scientific,” “smooth gradient,” or “animated.”
                </li>
              </ul>

              <h5>🧠 Example prompts:</h5>
              <div className="prompt-examples">
                <p>
                  <code>Visualize a 3D surface of z = sin(x) * cos(y) from -5 to 5 with grid lines.</code>
                </p>
                <p>
                  <code>Visualize in 2D the normal distribution curve with mean = 0, σ = 1.</code>
                </p>
                <p>
                  <code>Visualize the electric field around two opposite charges with arrows showing field direction.</code>
                </p>
              </div>
            </div>
          )}
        </div>

        <button className="new-chat-btn" onClick={onNewChat} title="New Chat">
          <LuSquarePen />
        </button>
      </div>
    </div>
  );
}
