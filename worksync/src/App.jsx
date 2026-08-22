import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import KanbanBoard from "./pages/KanbanBoard";
import Team from "./pages/Team";
import Chat from "./pages/Chat";
import Calendar from "./pages/Calendar";
import Files from "./pages/Files";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";

import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  const token = localStorage.getItem("token");

  return (
    <>
      <Toaster position="top-right" />

      <Routes>
        {/* ========================================
            PUBLIC ROUTES
        ======================================== */}

        <Route
          path="/"
          element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
        />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        {/* ========================================
            PROTECTED ROUTES
        ======================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kanban"
          element={
            <ProtectedRoute>
              <KanbanBoard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <Team />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />

        <Route
          path="/files"
          element={
            <ProtectedRoute>
              <Files />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* ========================================
            INVALID URL
        ======================================== */}

        <Route
          path="*"
          element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </>
  );
}

export default App;
