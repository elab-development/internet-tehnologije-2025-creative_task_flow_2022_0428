import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login";
import Register from "./pages/Register";

import SpecialistDashboard from "./pages/specialist/SpecialistDashboard";
import SpecialistTaskDetails from "./pages/specialist/SpecialistTaskDetails";

import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerProjectDetails from "./pages/manager/ManagerProjectsDetails";
import ManagerProjectMetrics from "./pages/manager/ManagerProjectMetrics";

import AdminUsers from "./pages/admin/AdminUsers";
import AdminMetrics from "./pages/admin/AdminMetrics";

import Profile from "./pages/Profile";

import Navbar from "./components/Navbar";
import { api, setAuthToken, extractErrorMessage } from "./api";

function getHomeRoute(role) {
  switch (role) {
    case "admin":
      return "/admin/users";
    case "manager":
      return "/manager";
    case "specialist":
      return "/specialist";
    default:
      return "/login";
  }
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const role = user?.role || null;

  const homeRoute = useMemo(() => getHomeRoute(role), [role]);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const onLoginSuccess = async (credentials, setError) => {
    try {
      const res = await api.post("/login", credentials);

      const data = res.data?.data;
      const newToken = data?.token;
      const newUser = data?.user;

      if (!newToken || !newUser) {
        setError?.("Neispravan odgovor servera");
        return false;
      }

      sessionStorage.setItem("token", newToken);
      sessionStorage.setItem("user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      return true;
    } catch (err) {
      setError?.(extractErrorMessage(err));
      return false;
    }
  };

  const onRegisterSuccess = async (payload, setError) => {
    try {
      const res = await api.post("/register", payload);

      const data = res.data?.data;
      const newToken = data?.token;
      const newUser = data?.user;

      if (!newToken || !newUser) {
        setError?.("Neispravan odgovor servera");
        return false;
      }

      sessionStorage.setItem("token", newToken);
      sessionStorage.setItem("user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      return true;
    } catch (err) {
      setError?.(extractErrorMessage(err));
      return false;
    }
  };

  const onLogoutSuccess = async () => {
    try {
      await api.post("/logout");
    } catch (e) {}

    sessionStorage.clear();
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const requireAuth = (element) => {
    if (!token) return <Navigate to="/login" replace />;
    return element;
  };

  const requireRole = (allowed, element) => {
    if (!token) return <Navigate to="/login" replace />;
    if (!role || !allowed.includes(role)) return <Navigate to={homeRoute} replace />;
    return element;
  };

  return (
    <BrowserRouter>
      <Navbar token={token} role={role} user={user} onLogout={onLogoutSuccess} />

      <Routes>
        <Route
          path="/"
          element={token ? <Navigate to={homeRoute} replace /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={token ? <Navigate to={homeRoute} replace /> : <Login onLogin={onLoginSuccess} />}
        />

        <Route
          path="/register"
          element={token ? <Navigate to={homeRoute} replace /> : <Register onRegister={onRegisterSuccess} />}
        />

        <Route
          path="/profile"
          element={requireAuth(<Profile />)}
        />

        <Route
          path="/specialist"
          element={requireRole(["specialist"], <SpecialistDashboard />)}
        />
        <Route
          path="/specialist/tasks/:id"
          element={requireRole(["specialist"], <SpecialistTaskDetails />)}
        />

        <Route
          path="/manager"
          element={requireRole(["manager"], <ManagerDashboard />)}
        />
        <Route
          path="/manager/projects/:id"
          element={requireRole(["manager"], <ManagerProjectDetails />)}
        />
        <Route
          path="/manager/projects/:id/metrics"
          element={requireRole(["manager"], <ManagerProjectMetrics />)}
        />

        <Route
          path="/admin/users"
          element={requireRole(["admin"], <AdminUsers />)}
        />
        <Route
          path="/admin/metrics"
          element={requireRole(["admin"], <AdminMetrics />)}
        />

        <Route path="*" element={<Navigate to={token ? homeRoute : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
