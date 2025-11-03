// src/App.jsx
import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="app-container">
      {/* Global layout container */}
      <Outlet /> {/* 👈 All pages (Home, Dashboard, etc.) render here */}
    </div>
  );
}
