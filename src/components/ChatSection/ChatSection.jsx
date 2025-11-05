import { useState, useRef, useEffect } from "react";
import { FaArrowUp, FaCircle } from "react-icons/fa6";
import { CgRedo } from "react-icons/cg";
import { TbCopy, TbCopyCheck } from "react-icons/tb";
import "./ChatSection.css";
import ChatSectionHeader from "./ChatSectionHeader/ChatSectionHeader"; // ✅ new header component

// 🔹 Rotating placeholder prompts
const PLACEHOLDERS = [
  // 🔹 Physics
  "the pattern of two overlapping light waves",
  "the electric field around opposite charges",
  "a pendulum swinging between energy states",
  "the orbits of planets around a star",
  "a particle moving in random Brownian motion",

  // 🔹 Math – 2D
  "a 2D bell curve of probability density",
  "a regression line through sample data",
  "sine and cosine waves on one plane",
  "where two functions intersect on a grid",

  // 🔹 Math – 3D
  "a 3D surface of z = sin(x)cos(y)",
  "a rotating 3D field made of arrows",
  "a spiral wrapping around the z-axis",
  "a 3D scatter of clustered points",

  // 🔹 Nature / Music / Creativity
  "an ant colony’s tunnel network underground",
  "tree rings forming over time",
  "sound waves from a guitar chord",
  "the flow of ocean currents",
  "a heartbeat shown as a waveform",
];

export default function ChatSection() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [placeholder, setPlaceholder] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef(null);

  // 🔹 Auto focus + placeholder typing effect
  useEffect(() => {
    inputRef.current?.focus();

    let charIndex = 0;
    let deleting = false;
    let interval;

    const typeEffect = () => {
      const fullText = PLACEHOLDERS[currentIndex];
      if (!deleting) {
        setPlaceholder(fullText.substring(0, charIndex + 1));
        charIndex++;
        if (charIndex === fullText.length) {
          deleting = true;
          clearInterval(interval);
          setTimeout(() => {
            interval = setInterval(typeEffect, 20);
          }, 2500); // pause before deleting
        }
      } else {
        setPlaceholder(fullText.substring(0, charIndex - 1));
        charIndex--;
        if (charIndex === 0) {
          deleting = false;
          setCurrentIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        }
      }
    };

    interval = setInterval(typeEffect, 20);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const pushMessage = (role, content) =>
    setMessages((prev) => [...prev, { role, content }]);

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    window.dispatchEvent(
      new CustomEvent("stochify:viz", {
        detail: { code: "// new chat started", dimension: "2d", analysis: "{}" },
      })
    );
  };

  const handleCopy = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleSend = async (e, textOverride = null) => {
    e?.preventDefault?.();
    const text = textOverride || input.trim();
    if (!text || loading) return;

    pushMessage("user", text);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.stochify.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const t = await res.text();
        pushMessage(
          "assistant",
          `⚠️ Server error (${res.status}): ${t || "unknown"}`
        );
        setLoading(false);
        return;
      }

      const data = await res.json();
      const { analysis, dimension, code, chat_response } = data;

      let reply = chat_response;
      if (!reply) {
        try {
          const parsed = JSON.parse(analysis);
          reply = parsed.chat_response || "✅ Visualization ready.";
        } catch {
          reply = "✅ Visualization ready.";
        }
      }

      pushMessage("assistant", reply);

      if (code) {
        window.dispatchEvent(
          new CustomEvent("stochify:viz", {
            detail: { code, dimension, analysis },
          })
        );
      }
    } catch (err) {
      pushMessage("assistant", `⚠️ Network error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRedo = (index) => {
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        handleSend(null, messages[i].content);
        break;
      }
    }
  };

  return (
    <div className="chat-section">
      {/* ✅ Header is now its own component */}
      <ChatSectionHeader onNewChat={handleNewChat} />

      {/* 🔹 Main chat window */}
      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message-wrapper ${m.role}`}>
            <div className={`chat-message ${m.role}`}>{m.content}</div>

            <div className={`message-tools ${m.role}`}>
              <button
                className={`copy-btn ${m.role}`}
                onClick={() => handleCopy(m.content, i)}
                title="Copy message"
              >
                {copiedIndex === i ? <TbCopyCheck /> : <TbCopy />}
              </button>

              {m.role === "assistant" && (
                <button
                  className={`redo-btn ${m.role}`}
                  onClick={() => handleRedo(i)}
                  title="Regenerate response"
                >
                  <CgRedo />
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-message assistant" aria-live="polite">
            <FaCircle className="thinking-dot" />
          </div>
        )}
      </div>

      {/* 🔹 Chat input bar */}
      <form className="chatbar" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          placeholder={"Visualize " + (placeholder || "")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          disabled={loading}
        />
        <button type="submit" aria-label="Send" disabled={loading}>
          <FaArrowUp />
        </button>
      </form>
    </div>
  );
}
