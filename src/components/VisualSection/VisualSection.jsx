import { useEffect, useRef, useState } from "react";
import "./VisualSection.css";
import CodeVisualToggle from "./CodeVisualToggle/CodeVisualToggle";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";

// === Helper: Dynamic Script Loader (used for D3) ===
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.type = "text/javascript";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(script);
  });
}

// === Sanitizer: D3 / 2D ===
function sanitize2DCode(code) {
  return code
    .replace(/<script[^>]*>/gi, "")
    .replace(/<\/script>/gi, "")
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/```/g, "")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("export ")) return "";
      if (trimmed.startsWith("import ")) return "";
      return line;
    })
    .join("\n")
    .replace(/d3\.select\(['"]body['"]\)/g, "d3.select('#viz')")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

// === Sanitizer: Three.js / 3D ===
function sanitize3DCode(code) {
  return code
    .replace(/<script[^>]*>/gi, "")
    .replace(/<\/script>/gi, "")
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/```/g, "")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (/^import\s+\*\s+as/.test(trimmed))
        return trimmed.replace(
          /^import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/,
          'const $1 = await import("$2")'
        );
      if (/^import\s+\{/.test(trimmed))
        return trimmed.replace(
          /^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/,
          'const { $1 } = await import("$2")'
        );
      if (trimmed.startsWith("export ")) return "";
      return line;
    })
    .join("\n")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

async function run2DVisualization(code) {
  if (!window.d3) await loadScript("https://d3js.org/d3.v7.min.js");
  const cleaned = sanitize2DCode(code);

  // Build the function string safely
  const wrapped = `
    return (async () => {
      try {
        ${cleaned}
      } catch (err) {
        console.error("2D Visualization Error:", err);
        throw err;
      }
    })();
  `;

  const fn = new Function(wrapped);
  await fn();
}

// === Runner: Three.js (3D) ===
async function run3DVisualization(code) {
  // Load Three.js and OrbitControls once
  if (!window.THREE) {
    const THREE = await import("https://esm.sh/three@0.160.0");
    const { OrbitControls } = await import(
      "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js"
    );
    window.THREE = THREE;
    window.OrbitControls = OrbitControls;
  }

  const cleaned = sanitize3DCode(code);

  // ✅ Build wrapped string safely
  const wrapped = `
    return (async () => {
      try {
        ${cleaned}
      } catch (err) {
        console.error("3D Visualization Error:", err);
        throw err;
      }
    })();
  `;

  const fn = new Function(wrapped);
  await fn();
}

// === Runner: Demo Visualization (safe for UI + code display) ===
async function runDemoVisualization(vizRef) {
  try {
    // target only the #viz area, not the outer wrapper
    let viz = document.getElementById("viz");
    if (viz) viz.innerHTML = "";
    else {
      viz = document.createElement("div");
      viz.id = "viz";
      viz.style.width = "100%";
      viz.style.height = "100%";
      vizRef.current.appendChild(viz);
    }

    // Fetch and run demo.js
    const res = await fetch("/demo.js");
    if (!res.ok) throw new Error("Failed to load demo.js");
    const code = await res.text();

    // Reset demo flag in case of hot reload
    delete window.__SOLAR_DEMO_ACTIVE__;

    const fn = new Function(code);
    await fn();

    // ✅ Return the code so the caller can display it
    return code;
  } catch (err) {
    console.error("Demo visualization failed:", err);
    throw err;
  }
}

// === MAIN COMPONENT ===
export default function VisualSection() {
  const vizRef = useRef(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("visual");
  const [lastCode, setLastCode] = useState("");

  // === Auto-load Demo on Mount ===
  useEffect(() => {
    (async () => {
      try {
        const code = await runDemoVisualization(vizRef);
        setLastCode(code); // ✅ display the demo code in the code view
      } catch (err) {
        setError("Failed to load demo visualization.");
      }
    })();
  }, []);


  // === Handle incoming backend visualizations ===
  useEffect(() => {
    async function handleVizEvent(e) {
      const { code, dimension } = e.detail;
      setError(null);
      setLastCode(code || "");

      // Reset #viz container
      const existingViz = document.getElementById("viz");
      if (existingViz) existingViz.innerHTML = "";

      let viz = existingViz;
      if (!viz) {
        viz = document.createElement("div");
        viz.id = "viz";
        viz.style.width = "100%";
        viz.style.height = "100%";
        vizRef.current.appendChild(viz);
      }

      try {
        if (dimension === "2d") await run2DVisualization(code);
        else if (dimension === "3d") await run3DVisualization(code);
        else if (dimension === "demo") await runDemoVisualization(vizRef);
        else throw new Error("Unknown visualization dimension.");
      } catch (err) {
        console.error("Visualization execution failed:", err);
        setError(err.message || "Visualization error");
      }
    }

    window.addEventListener("stochify:viz", handleVizEvent);
    return () => window.removeEventListener("stochify:viz", handleVizEvent);
  }, []);

  // === Syntax Highlight when switching to code mode ===
  useEffect(() => {
    if (mode === "code") Prism.highlightAll();
  }, [lastCode, mode]);

  return (
    <div className="visual-wrapper" ref={vizRef}>
      <CodeVisualToggle mode={mode} onToggle={setMode} />
      {error && <pre className="viz-error">⚠️ {error}</pre>}

      <div
        id="viz"
        className={`viz-canvas ${mode === "visual" ? "active" : "hidden"}`}
      ></div>

      <pre
        className={`code-display language-javascript ${
          mode === "code" ? "active" : "hidden"
        }`}
      >
        <code className="language-javascript">
          {lastCode || "// No code available yet."}
        </code>
      </pre>
    </div>
  );
}
