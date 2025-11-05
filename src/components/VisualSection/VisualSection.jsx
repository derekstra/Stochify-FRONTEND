import { useEffect, useRef, useState } from "react";
import "./VisualSection.css";
import CodeVisualToggle from "./CodeVisualToggle/CodeVisualToggle";

export default function VisualSection() {
  const vizRef = useRef(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("visual");
  const [lastCode, setLastCode] = useState("");

  useEffect(() => {
    async function handleVizEvent(e) {
      const { code, dimension, analysis } = e.detail;
      setError(null);
      setLastCode(code || ""); // ✅ Save latest code for viewing

      let parsedAnalysis = {};
      try {
        parsedAnalysis = JSON.parse(analysis);
      } catch {
        parsedAnalysis = {};
      }

      const isCartesian =
        parsedAnalysis.cartesian === true || parsedAnalysis.cartesian === "true";

      // ✅ Do NOT clear visualization if user is toggling modes — only when new code arrives
      const existingViz = document.getElementById("viz");
      if (!isCartesian && existingViz) existingViz.innerHTML = "";

      let viz = existingViz;
      if (!viz) {
        viz = document.createElement("div");
        viz.id = "viz";
        viz.style.width = "100%";
        viz.style.height = "100%";
        vizRef.current.appendChild(viz);
      }

      try {
        // 3D setup
        if (dimension === "3d") {
          const THREE = await import("https://esm.sh/three@0.160.0");
          const { OrbitControls } = await import(
            "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js"
          );
          window.THREE = THREE;
          window.OrbitControls = OrbitControls;
        } else {
          await loadScript("https://d3js.org/d3.v7.min.js");
        }

        // Cartesian skeletons
        if (isCartesian) {
          if (dimension === "2d") await loadScript("/static/cartesian2D.js");
          if (dimension === "3d") await loadScript("/static/cartesian3D.js");
        }

        // Clean and run code
        const cleanedCode = code
          .replace(/```[a-zA-Z]*\n?/g, "")
          .replace(/```/g, "")
          .replace(/<\/?script[^>]*>/gi, "")
          .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
          .replace(/d3\.select\(['"]body['"]\)/g, "d3.select('#viz')")
          .replace(/new\s+OrbitControls/g, "new window.OrbitControls")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .trim();

        new Function(cleanedCode)();
      } catch (err) {
        console.error("Visualization error:", err);
        setError(err.message);
      }
    }

    window.addEventListener("stochify:viz", handleVizEvent);
    return () => window.removeEventListener("stochify:viz", handleVizEvent);
  }, []);

  return (
    <div className="visual-wrapper" ref={vizRef}>
      <CodeVisualToggle mode={mode} onToggle={setMode} />

      {error && <pre className="viz-error">⚠️ {error}</pre>}

      {/* ✅ Keep both DOM nodes — just hide one instead of re-rendering */}
      <div
        id="viz"
        className={`viz-canvas ${mode === "visual" ? "active" : "hidden"}`}
      ></div>

      <pre
        className={`code-display ${mode === "code" ? "active" : "hidden"}`}
      >
        {lastCode || "// No code available yet."}
      </pre>
    </div>
  );
}

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
