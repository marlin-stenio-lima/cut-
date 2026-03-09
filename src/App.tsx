import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ProfileSelectionPage from './pages/auth/ProfileSelectionPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import LandingPage from './pages/LandingPage'
import './App.css'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth()

  console.log('[PrivateRoute] Check:', { authenticated: !!session, loading })

  if (loading) {
    return null
  }

  if (!session) {
    console.log('[PrivateRoute] No session, redirecting to login')
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile-selection" element={<ProfileSelectionPage />} />
            <Route path="/dashboard/*" element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
