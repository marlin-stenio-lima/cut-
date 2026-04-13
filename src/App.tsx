import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ModalProvider } from './context/ModalContext'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import LandingPage from './pages/LandingPage'
import EditorRegistrationPage from './pages/auth/EditorRegistrationPage'
import EditorThanksPage from './pages/auth/EditorThanksPage'
import MarketplacePage from './pages/MarketplacePage'
import ProfileSelectionPage from './pages/auth/ProfileSelectionPage'
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
        <ModalProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register/editor" element={<EditorRegistrationPage />} />
              <Route path="/register/thanks" element={<EditorThanksPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/profile-selection" element={
                <PrivateRoute>
                  <ProfileSelectionPage />
                </PrivateRoute>
              } />
              <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
              <Route path="/dashboard/*" element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              } />
            </Routes>
          </Router>
        </ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
