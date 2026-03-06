import React from 'react'
import { useAuth } from '../../context/AuthContext'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ClientDashboard from './ClientDashboard'
import EditorDashboard from './EditorDashboard'
import { Navigate, Routes, Route } from 'react-router-dom'
import ChatPage from './ChatPage'
import SettingsPage from './SettingsPage'
import NewProjectPage from './client/NewProjectPage'
import MyProjectsPage from './client/MyProjectsPage'
import ExplorePage from './editor/ExplorePage'
import MyWorkPage from './editor/MyWorkPage'

const DashboardPage: React.FC = () => {
    const { profile, loading, user } = useAuth()

    console.log('[DashboardPage] Render:', { user: !!user, hasProfile: !!profile, role: profile?.role, loading })

    if (loading) {
        return (
            <div className="auth-container">
                <div style={{ textAlign: 'center' }}>
                    <div className="glow-cyan" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Carregando seu espaço...</p>
                </div>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        )
    }

    // If logged in but no profile/role yet, redirect to selection
    if (!profile || !profile.role) {
        console.log('[DashboardPage] No profile/role found, redirecting to selection')
        return <Navigate to="/profile-selection" />
    }

    const role = profile.role as 'client' | 'editor'

    return (
        <DashboardLayout role={role}>
            <Routes>
                {/* Default Dashboard Home */}
                <Route path="/" element={role === 'client' ? <ClientDashboard /> : <EditorDashboard />} />

                {/* Shared Routes */}
                <Route path="chat" element={<ChatPage />} />
                <Route path="settings" element={<SettingsPage />} />

                {/* Client Only Routes */}
                {role === 'client' && (
                    <>
                        <Route path="new-project" element={<NewProjectPage />} />
                        <Route path="projects" element={<MyProjectsPage />} />
                    </>
                )}

                {/* Editor Only Routes */}
                {role === 'editor' && (
                    <>
                        <Route path="explore" element={<ExplorePage />} />
                        <Route path="work" element={<MyWorkPage />} />
                    </>
                )}

                {/* Catch-all to default dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </DashboardLayout>
    )
}

export default DashboardPage
