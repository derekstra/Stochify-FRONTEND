import { useState, useEffect, useRef } from "react";
import { FaArrowUp } from "react-icons/fa6";
import "./ChatSectionSearch.css";

// 🔹 Rotating placeholder prompts
const PLACEHOLDERS = [
  // 🔸 Data & Network
  "a network of nodes showing connections",
  "a heatmap of traffic across time",
  "a scatterplot of focus and output",
  "a stock's price path from simulation",
  "AI decision zones shown in color",
  "the gradient flow through a network",

  // 🔸 Time & Patterns
  "a timeline of innovation bursts",
  "beats changing across a timeline",
  "a curve showing exponential decay",
  "dice roll outcomes forming patterns",
  "a chaos pattern generated from seeds",

  // 🔸 Math & Geometry
  "the shape of a normal distribution",
  "a spiral expanding from the origin",
  "a geometric pattern in slow motion",
  "a gradient morphing through hues",

  // 🔸 Nature & Space
  "the branching roots of an old tree",
  "a galaxy spinning in deep space",
  "migration routes across continents",
  "the flow of ocean currents on Earth",
  "rainfall intensity across mountains",
  "a glowing orbit tracing random motion",

  // 🔸 Sound & Emotion
  "harmony visualized across notes",
  "a waveform fading into the distance",
  "the emotional arc of a short film",
  "a color field shifting with mood",
  "a field of particles reacting to touch",
  "a neural rhythm pulsing with life",

  // 🔸 Abstract & Conceptual
  "a thought path forming in motion",
  "a wave pattern dissolving to noise",
];

export default function ChatSectionSearch({ onSend, hasStartedChat, inputRef, loading }) {
  const [input, setInput] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (hasStartedChat) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    onSend(text);
  };

  return (
    <form className="chatbar" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        placeholder={"Visualize " + (placeholder || "")}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
      />
      <button type="submit" aria-label="Send">
        <FaArrowUp />
      </button>
    </form>
  );
}
