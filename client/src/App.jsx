import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { useEffect } from "react"
import { useAuthStore } from "./store/authStore"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Onboarding from "./pages/Onboarding"
import Dashboard from "./pages/Dashboard"
import LearningPath from "./pages/LearningPath"
import ChatPage from "./pages/ChatPage"
import Profile from "./pages/Profile"
import ProtectedRoute from "./components/ProtectedRoute"
import LoadingSpinner from "./components/ui/LoadingSpinner"

export default function App() {
  const { loadUser, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  if (isLoading) return <LoadingSpinner size="lg" text="Loading EduPath..." />

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151" },
          success: { iconTheme: { primary: "#3b82f6", secondary: "#f9fafb" } }
        }}
      />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/path/:pathId" element={<LearningPath />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
