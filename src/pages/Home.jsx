import { useState, useRef } from "react";
import ChatSection from "../components/ChatSection/ChatSection";
import VisualSection from "../components/VisualSection/VisualSection";
import "../styles/Home.css";

export default function Home() {
  const [chatWidth, setChatWidth] = useState(400); // starting width
  const isResizing = useRef(false);

  const handleMouseDown = () => {
    isResizing.current = true;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newWidth = Math.min(Math.max(e.clientX, 350), 700); // clamp between 250–700px
    setChatWidth(newWidth);
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  };

  return (
    <div
      className="home-container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="chat-wrapper"
        style={{ width: `${chatWidth}px` }}
      >
        <ChatSection />
      </div>

      <div
        className="resizer"
        onMouseDown={handleMouseDown}
      />

      <div className="visual-wrapper">
        <VisualSection />
      </div>
    </div>
  );
}
