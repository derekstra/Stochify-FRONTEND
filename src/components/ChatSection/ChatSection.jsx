import { useState, useRef, useEffect } from "react";
import { FaArrowUp, FaCircle } from "react-icons/fa6";
import { CgRedo } from "react-icons/cg";
import { TbCopy, TbCopyCheck } from "react-icons/tb";
import "./ChatSection.css";
import ChatSectionHeader from "./ChatSectionHeader/ChatSectionHeader"; // ✅ new header component

// 🔹 Rotating placeholder prompts
const PLACEHOLDERS = [
  "a network of nodes showing connections",
  "a heatmap of traffic across time",
  "a stock's price path from simulation",
  "a scatterplot of focus and output",
  "a timeline of innovation bursts",
  "a curve showing exponential decay",
  "the shape of a normal distribution",
  "a spiral expanding from the origin",
  "a wave pattern dissolving to noise",
  "the branching roots of an old tree",
  "a galaxy spinning in deep space",
  "migration routes across continents",
  "the flow of ocean currents on Earth",
  "rainfall intensity across mountains",
  "a geometric pattern in slow motion",
  "a gradient morphing through hues",
  "a field of particles reacting to touch",
  "a glowing orbit tracing random motion",
  "a neural rhythm pulsing with life",
  "a waveform fading into the distance",
  "the emotional arc of a short film",
  "harmony visualized across notes",
  "beats changing across a timeline",
  "a color field shifting with mood",
  "dice roll outcomes forming patterns",
  "AI decision zones shown in color",
  "a chaos pattern generated from seeds",
  "the gradient flow through a network",
  "a thought path forming in motion",
];

export default function ChatSection() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [placeholder, setPlaceholder] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  const inputRef = useRef(null);
  const chatWindowRef = useRef(null);
  const intervalRef = useRef(null);

  // ✅ Append Stochify intro message once on mount
  useEffect(() => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "I'm Stochify — I can visualize anything you describe. Just type your request below. Here's an example visualization of the Solar System with realistic orbiting speeds.",
      },
    ]);
  }, []);

  // ✅ Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (hasStartedChat) {
      // Stop any existing interval
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPlaceholder("anything");
      return;
    }

    let charIndex = 0;
    let deleting = false;

    const typeEffect = () => {
      const fullText = PLACEHOLDERS[currentIndex];
      if (!deleting) {
        setPlaceholder(fullText.substring(0, charIndex + 1));
        charIndex++;
        if (charIndex === fullText.length) {
          deleting = true;
          clearInterval(intervalRef.current);
          setTimeout(() => {
            intervalRef.current = setInterval(typeEffect, 20);
          }, 2500);
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

    intervalRef.current = setInterval(typeEffect, 20);
    return () => clearInterval(intervalRef.current);
  }, [currentIndex, hasStartedChat]);

  const pushMessage = (role, content) =>
    setMessages((prev) => [...prev, { role, content }]);

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setHasStartedChat(false);
    window.dispatchEvent(
      new CustomEvent("stochify:viz", {
        detail: { code: "// new chat started", dimension: "2d", analysis: "{}" },
      })
    );
    inputRef.current?.focus();
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

    // 🧩 stop animation immediately before updating state
    if (intervalRef.current) clearInterval(intervalRef.current);

    // ✅ stop rotating placeholder permanently after first send
    if (!hasStartedChat) {
      setHasStartedChat(true);
      setPlaceholder("anything");
    }

    pushMessage("user", text);
    setInput("");
    setLoading(true);
    setTimeout(() => inputRef.current?.focus(), 50);

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
      const { analysis, dimension, code, description } = data;

      let reply = description;
      if (!reply) {
        try {
          const parsed = JSON.parse(analysis);
          reply = parsed.description || "✅ Visualization ready.";
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
      inputRef.current?.focus();
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
      <ChatSectionHeader onNewChat={handleNewChat} />

      <div className="chat-window" ref={chatWindowRef}>
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
          autoFocus
        />
        <button type="submit" aria-label="Send" disabled={loading}>
          <FaArrowUp />
        </button>
      </form>

      {/* 🔹 Terms of Service footer */}
      <footer className="chat-terms">
        <a href="/terms" target="_blank" rel="noopener noreferrer">
          Terms of Service
        </a>
      </footer>
    </div>
  );
}
