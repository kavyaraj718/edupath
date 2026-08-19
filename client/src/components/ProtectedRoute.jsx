import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../store/authStore"
import LoadingSpinner from "./ui/LoadingSpinner"

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) return <LoadingSpinner size="lg" text="Loading..." />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  const onOnboardingPage = window.location.pathname === "/onboarding"
  if (user && !user.onboardingComplete && !onOnboardingPage) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
