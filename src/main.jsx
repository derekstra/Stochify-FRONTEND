// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";

// ===== Pages =====
import Home from "./pages/Home.jsx";
import Upload from "./pages/upload.jsx";
import Create from "./pages/create.jsx";
import TryDemo from "./pages/try-demo.jsx";
import Dashboard from "./pages/dashboard.jsx";
import Project from "./pages/project.jsx";
import Privacy from "./pages/privacy-policy.jsx";
import Terms from "./pages/terms-of-service.jsx";
import Login from "./pages/login.jsx";
import NotFound from "./pages/notfound.jsx"; // ✅ new import

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* ✅ All pages share App (which holds Header/Footer) */}
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="upload" element={<Upload />} />
          <Route path="create" element={<Create />} />
          <Route path="try-demo" element={<TryDemo />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="project/:id" element={<Project />} />
          <Route path="privacy-policy" element={<Privacy />} />
          <Route path="terms-of-service" element={<Terms />} />
          <Route path="login" element={<Login />} />
          {/* 👇 Catch-all route must go last */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
