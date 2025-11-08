import { useState, useRef, useEffect } from "react";
import { CgRedo } from "react-icons/cg";
import { TbCopy, TbCopyCheck } from "react-icons/tb";
import "./ChatSectionChat.css";

export default function ChatSectionChat({ messages, loading, onRedo }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [status, setStatus] = useState("");       // live stage text
  const [finalMessage, setFinalMessage] = useState(null);
  const chatWindowRef = useRef(null);
  const [taskId, setTaskId] = useState(null);

  // === Auto-scroll ===
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading, status, finalMessage]);

  // === When a new chat starts ===
  useEffect(() => {
    // if your main /api/chat POST sets a task_id, you can store it here
    // e.g., onSubmit in parent calls setTaskId(newId)
  }, [taskId]);

  // === Poll backend for status ===
  useEffect(() => {
    if (!taskId) return;

    const poll = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/status/${taskId}`);
        const data = await res.json();
        if (data.status === "complete") {
          setStatus("");
          setFinalMessage(data.data?.chat_response || "");
        } else {
          setStatus(data.status);
          setFinalMessage(null);
          setTimeout(poll, 1000);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    poll();
  }, [taskId]);

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
        </div>
      ))}

      {/* Live status text */}
      {status && (
        <div className="chat-message assistant status-text" data-text={status}>
          {status}
        </div>
      )}

      {/* Final message */}
      {finalMessage && (
        <div className="chat-message assistant" aria-live="polite">
          {finalMessage}
        </div>
      )}
    </div>
  );
}
