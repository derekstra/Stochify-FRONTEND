import { useEffect, useRef, useState } from "react";
import "./VisualSection.css";
import CodeVisualToggle from "./CodeVisualToggle/CodeVisualToggle";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";

export default function VisualSection() {
  const vizRef = useRef(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("visual");
  const [lastCode, setLastCode] = useState("");

  // 🔹 Auto-load demo.js on first mount
  useEffect(() => {
    async function loadDemo() {
      try {
        const res = await fetch("/demo.js");
        const code = await res.text();
        const event = new CustomEvent("stochify:viz", {
          detail: {
            code,
            dimension: "3d",
            analysis: JSON.stringify({ cartesian: false }),
          },
        });
        window.dispatchEvent(event);
      } catch (err) {
        console.error("Failed to load demo:", err);
        setError("Failed to load demo.js");
      }
    }
    loadDemo();
  }, []);

  // 🔹 Visualization handler
  useEffect(() => {
    async function handleVizEvent(e) {
      const { code, dimension, analysis } = e.detail;
      setError(null);
      setLastCode(code || "");

      let parsedAnalysis = {};
      try {
        parsedAnalysis = JSON.parse(analysis);
      } catch {
        parsedAnalysis = {};
      }

      const isCartesian =
        parsedAnalysis.cartesian === true || parsedAnalysis.cartesian === "true";

      // 🔹 Prepare visualization container
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
        // 🔹 Dynamically import necessary libraries (only once)
        if (dimension === "3d") {
          if (!window.THREE) {
            const THREE = await import("https://esm.sh/three@0.160.0");
            const { OrbitControls } = await import(
              "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js"
            );
            window.THREE = THREE;
            window.OrbitControls = OrbitControls;
          }
        } else if (!window.d3) {
          await loadScript("https://d3js.org/d3.v7.min.js");
        }

        const cleanedCode = code
          // remove <script> wrappers (both normal + module)
          .replace(/<script[^>]*>/gi, "")
          .replace(/<\/script>/gi, "")
          // remove Markdown code fences
          .replace(/```[a-zA-Z]*\n?/g, "")
          .replace(/```/g, "")
          // Convert static ES6 imports to dynamic imports
          .split('\n')
          .map(line => {
            const trimmed = line.trim();
            
            // Convert: import * as THREE from 'url'
            if (trimmed.match(/^import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/)) {
              return trimmed.replace(
                /^import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/,
                'const $1 = await import("$2")'
              );
            }
            
            // Convert: import { OrbitControls } from 'url'
            if (trimmed.match(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/)) {
              return trimmed.replace(
                /^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/,
                'const { $1 } = await import("$2")'
              );
            }
            
            // Remove export statements
            if (trimmed.startsWith('export ')) return '';
            
            return line;
          })
          .filter(line => line !== '')
          .join('\n')
          // handle body selectors for D3
          .replace(/d3\.select\(['"]body['"]\)/g, "d3.select('#viz')")
          // fix encoded characters
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .trim();

        (async () => {
          try {
            // Wrap as a real async function that returns a Promise
            const asyncWrapped = `
              return (async () => {
                try {
                  ${cleanedCode}
                } catch (err) {
                  console.error('Visualization runtime error:', err);
                  throw err;
                }
              })();
            `;

            // Create the function and immediately await its returned promise
            const fn = new Function(asyncWrapped);
            await fn();
          } catch (err) {
            console.error("Visualization execution failed:", err);
            setError(err.message || "Visualization error");
          }
        })();

      } catch (err) {
        console.error("Visualization error:", err);
        setError(err.message);
      }
    }

    window.addEventListener("stochify:viz", handleVizEvent);
    return () => window.removeEventListener("stochify:viz", handleVizEvent);
  }, []);

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
