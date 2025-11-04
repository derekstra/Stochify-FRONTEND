import { useState } from "react";
import { FaArrowUp } from "react-icons/fa6";
import "./ChatSection.css";

export default function ChatSection() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const pushMessage = (role, content) =>
    setMessages((prev) => [...prev, { role, content }]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    // show user message
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

      // Prefer explicit chat_response; fallback to parsing analysis
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

      // Optional: broadcast the viz to the right panel (VisualSection can listen)
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
      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant" aria-live="polite">
            Thinking...
          </div>
        )}
      </div>

      <form className="chatbar" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Visualize anything"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" aria-label="Send" disabled={loading}>
          <FaArrowUp />
        </button>
      </form>
    </div>
  );
}
