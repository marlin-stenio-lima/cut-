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
    return (
      <div className="auth-container">
        <div style={{ textAlign: 'center' }}>
          <div className="glow-cyan" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Sincronizando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    console.log('[PrivateRoute] No session, redirecting to login')
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

function App() {
  return (
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
  )
}

export default App
