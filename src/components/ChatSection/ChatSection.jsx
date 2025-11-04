import { useState } from "react";
import { FaArrowUp, FaCircle } from "react-icons/fa6";
import { LuSquarePen } from "react-icons/lu";
import "./ChatSection.css";

export default function ChatSection() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const pushMessage = (role, content) =>
    setMessages((prev) => [...prev, { role, content }]);

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    // clear visuals area too
    window.dispatchEvent(new CustomEvent("stochify:viz", { detail: { code: "", dimension: "", analysis: "" } }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
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
        pushMessage("assistant", `⚠️ Server error (${res.status}): ${t || "unknown"}`);
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

  return (
    <div className="chat-section">
      {/* 🔹 Header with new chat button */}
      <div className="chat-header">
        <button className="new-chat-btn" onClick={handleNewChat} title="New Chat">
          <LuSquarePen />
        </button>
      </div>

      {/* 🔹 Main chat window */}
      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            {m.content}
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
          type="text"
          placeholder="Visualize anything"
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
