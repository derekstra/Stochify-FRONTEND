import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { CgRedo } from "react-icons/cg";
import { TbCopy, TbCopyCheck } from "react-icons/tb";
import "./ChatSectionChat.css";

export default function ChatSectionChat({ messages, loading, onRedo }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [status, setStatus] = useState("");       // live stage text
  const [finalMessage, setFinalMessage] = useState(null);
  const chatWindowRef = useRef(null);

  // === Auto-scroll ===
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading, status, finalMessage]);

  // === Socket connection to backend ===
  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("status_update", (data) => {
      if (data.stage === "complete") {
        setStatus("");
        setFinalMessage(data.data?.chat_response || "");
      } else {
        setStatus(data.stage);
        setFinalMessage(null);
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection failed:", err);
    });

    return () => socket.disconnect();
  }, []);

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

      {/* Live status text from backend */}
      {status && (
        <div className="chat-message assistant status-text" data-text={status}>
          {status}
        </div>
      )}

      {/* Final assistant response after "complete" */}
      {finalMessage && (
        <div className="chat-message assistant" aria-live="polite">
          {finalMessage}
        </div>
      )}
    </div>
  );
}
