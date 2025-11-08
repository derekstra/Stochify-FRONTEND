import { useState, useRef, useEffect } from "react";
import ChatSectionHeader from "./ChatSectionHeader/ChatSectionHeader";
import ChatSectionChat from "./ChatSectionChat/ChatSectionChat";
import ChatSectionSearch from "./ChatSectionSearch/ChatSectionSearch";
import "./ChatSection.css";

export default function ChatSection() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [taskId, setTaskId] = useState(null);   // ✅ new
  const inputRef = useRef(null);

  // ✅ Intro message
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content:
          "I'm Stochify — I can visualize anything you describe. Just type your request below. Here's an example visualization of the Solar System with realistic orbiting speeds.",
      },
    ]);
  }, []);

  const pushMessage = (role, content) =>
    setMessages((prev) => [...prev, { role, content }]);

  const handleNewChat = () => {
    setMessages([]);
    setHasStartedChat(false);
    setTaskId(null);
    window.dispatchEvent(
      new CustomEvent("stochify:viz", {
        detail: { code: "// new chat started", dimension: "2d", analysis: "{}" },
      })
    );
    inputRef.current?.focus();
  };

  const handleSend = async (text) => {
    if (!text || loading) return;

    setHasStartedChat(true);
    pushMessage("user", text);
    setLoading(true);

    try {
      // 🔹 Start async pipeline
      const res = await fetch("https://api.stochify.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const t = await res.text();
        pushMessage("assistant", `⚠️ Server error (${res.status}): ${t}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const newTaskId = data.task_id;
      setTaskId(newTaskId); // ✅ connect to polling system

      // temporary placeholder while backend works
      pushMessage("assistant", "⏳ Processing your request...");
    } catch (err) {
      pushMessage("assistant", `⚠️ Network error: ${err?.message || err}`);
      setLoading(false);
    } finally {
      inputRef.current?.focus();
    }
  };

  const handleRedo = (index) => {
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        handleSend(messages[i].content);
        break;
      }
    }
  };

  return (
    <div className="chat-section">
      <ChatSectionHeader onNewChat={handleNewChat} />

      <ChatSectionChat
        messages={messages}
        loading={loading}
        onRedo={handleRedo}
        taskId={taskId}   // ✅ pass taskId down
      />

      <ChatSectionSearch
        onSend={handleSend}
        hasStartedChat={hasStartedChat}
        inputRef={inputRef}
        loading={loading}
      />

      <footer className="chat-terms">
        <a href="/terms" target="_blank" rel="noopener noreferrer">
          Terms of Service
        </a>
      </footer>
    </div>
  );
}
