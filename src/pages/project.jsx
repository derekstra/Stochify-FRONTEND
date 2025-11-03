import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProjectLeft from "../components/Project-left/Project-left";
import ProjectRight from "../components/Project-right/Project-right";
import ProjectCenter from "../components/Project-center/Project-center";
import { loadFileFromServer } from "../components/FilePreviewLoader";
import "../styles/project.css";

export default function Project() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState("preview");

  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);

  // === Sidebar Widths ===
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(400);
  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);

  useEffect(() => {
    document.title = "Project – Stochify";
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    // === Fetch User ===
    fetch("https://api.stochify.com/api/user", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("authToken");
        navigate("/login");
      });

    // === Fetch Project ===
    fetch(`https://api.stochify.com/api/cards/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch project");
        return res.json();
      })
      .then(async (data) => {
        setProject(data);
        setLoading(false);
        if (data.title) document.title = `${data.title} – Stochify`;

        // ✅ Handle file loading
        if (data.asset) {
          try {
            const fileObj = await loadFileFromServer(
              `https://api.stochify.com/api/projects/${data.asset.card_id}/assets/${data.asset.id}/download`,
              data.asset.file_name,
              data.asset.mime_type
            );
            setFile(fileObj);
          } catch (err) {
            console.error("Failed to load file:", err);
          }
        } else if (data.content) {
          const textFile = new File(
            [data.content],
            data.title || "file.txt",
            { type: "text/plain" }
          );
          setFile(textFile);
        }
      })
      .catch(() => {
        alert("Project not found or inaccessible.");
        navigate("/dashboard");
      });
  }, [id, navigate]);

  // === Handle Resizing ===
  const handleMouseMove = (e) => {
    if (isResizingLeft.current) {
      const newWidth = Math.min(Math.max(e.clientX, 160), 400);
      setLeftWidth(newWidth);
    } else if (isResizingRight.current) {
      const newWidth = Math.min(
        Math.max(window.innerWidth - e.clientX, 400),
        600
      );
      setRightWidth(newWidth);
    }
  };

  const stopResizing = () => {
    isResizingLeft.current = false;
    isResizingRight.current = false;
    document.body.style.userSelect = "";
  };

  const startResizingLeft = () => {
    isResizingLeft.current = true;
    document.body.style.userSelect = "none";
  };

  const startResizingRight = () => {
    isResizingRight.current = true;
    document.body.style.userSelect = "none";
  };

  const handleTitleUpdate = (newTitle) => {
    setProject((prev) => ({ ...prev, title: newTitle }));
    document.title = `${newTitle} – Stochify`;
  };

  if (loading) {
    return (
      <div className="project-loading">
        <img src="/WhiteS.png" alt="Stochify Logo" className="loading-logo" />
        <p>Loading project...</p>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div
      className={`project-page ${
        isResizingLeft.current || isResizingRight.current ? "dragging" : ""
      }`}
      onMouseMove={handleMouseMove}
      onMouseUp={stopResizing}
      onMouseLeave={stopResizing}
      style={{
        gridTemplateColumns: `${leftWidth}px 1fr ${rightWidth}px`,
      }}
    >
      {/* ===== Left Sidebar ===== */}
      <ProjectLeft
        project={project}
        user={user}
        onResizeStart={startResizingLeft}
        onTitleUpdate={handleTitleUpdate}
      />

      {/* ===== Middle Section (new component) ===== */}
      <ProjectCenter
        file={file}
        project={project}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* ===== Right Sidebar ===== */}
      <ProjectRight
        projectId={id}
        projectTitle={project.title}
        onResizeStart={startResizingRight}
        file={file}
        viewMode={viewMode}
      />
    </div>
  );
}
