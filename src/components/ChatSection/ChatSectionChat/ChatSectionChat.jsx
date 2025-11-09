import { useState, useRef, useEffect } from "react";
import { CgRedo } from "react-icons/cg";
import { TbCopy, TbCopyCheck } from "react-icons/tb";
import "./ChatSectionChat.css";

export default function ChatSectionChat({ messages, setMessages, loading, onRedo, taskId }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [status, setStatus] = useState(""); // temporary stage text
  const chatWindowRef = useRef(null);

  // === Auto-scroll ===
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, status]);

  // === Poll backend for live updates ===
  useEffect(() => {
    if (!taskId) return;
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch(`https://api.stochify.com/api/status/${taskId}`);
        const data = await res.json();
        if (!active) return;

        if (data.status === "complete") {
          setStatus("");
          const desc = data.data?.chat_response || "✅ Visualization ready.";

          // ✅ Push final assistant message into chat
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: desc },
          ]);

          // ✅ Trigger visualization
          window.dispatchEvent(
            new CustomEvent("stochify:viz", { detail: data.data })
          );
        } else {
          // show live backend stage
          setStatus(data.status);
          setTimeout(poll, 1000);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    poll();
    return () => { active = false; };
  }, [taskId, setMessages]);

  const handleCopy = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className="chat-window" ref={chatWindowRef}>
      {/* All persistent chat messages */}
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
                onClick={() => onRedo(i)}
                title="Regenerate response"
              >
                <CgRedo />
              </button>
            )}
          </div>

          {/* === Temporary status shown just under the user message === */}
          {i === messages.length - 1 && m.role === "user" && status && (
            <div className="temp-status-bubble">
              <span>{status}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
