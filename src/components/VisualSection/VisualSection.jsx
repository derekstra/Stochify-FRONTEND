import { useEffect, useRef, useState } from "react";
import "./VisualSection.css";

export default function VisualSection() {
  const vizRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function handleVizEvent(e) {
      const { code, dimension, analysis } = e.detail;
      setError(null);

      // 1️⃣ Parse cartesian info
      let parsedAnalysis = {};
      try {
        parsedAnalysis = JSON.parse(analysis);
      } catch {
        parsedAnalysis = {};
      }
      const isCartesian =
        parsedAnalysis.cartesian === true || parsedAnalysis.cartesian === "true";

      // 2️⃣ Reset visualization area (only if not Cartesian)
      if (!isCartesian && vizRef.current) vizRef.current.innerHTML = "";

      // 3️⃣ Create or reuse #viz container
      let viz = document.getElementById("viz");
      if (!viz) {
        viz = document.createElement("div");
        viz.id = "viz";
        viz.style.width = "100%";
        viz.style.height = "100%";
        vizRef.current.appendChild(viz);
      }

      // 4️⃣ Load required libraries dynamically
      try {
        if (dimension === "3d") {
          const THREE = await import("https://esm.sh/three@0.160.0");
          const { OrbitControls } = await import("https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js");
          window.THREE = THREE;
          window.OrbitControls = OrbitControls;
        } else {
          // D3 (non-module) can still use loadScript
          await loadScript("https://d3js.org/d3.v7.min.js");
        }

        // 5️⃣ If Cartesian, load base plane script
        if (isCartesian) {
          if (dimension === "2d") {
            await loadScript("/static/cartesian2D.js");
          } else if (dimension === "3d") {
            await loadScript("/static/cartesian3D.js");
          }
        }

        // 6️⃣ Clean and safely execute the generated code
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

        new Function(cleanedCode)(); // 🚀 run visualization
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
      {error && (
        <pre className="viz-error">⚠️ Visualization failed: {error}</pre>
      )}
    </div>
  );
}

// Utility loader (used for D3 and Cartesian skeletons only)
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(); // already loaded
    const script = document.createElement("script");
    script.src = src;
    script.type = "text/javascript"; // no modules here
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(script);
  });
}
