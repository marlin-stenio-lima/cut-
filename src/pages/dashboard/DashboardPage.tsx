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
import EditorOnboarding from './editor/EditorOnboarding'

const DashboardPage: React.FC = () => {
    const { profile, loading, user } = useAuth()

    console.log('[DashboardPage] Render:', { user: !!user, hasProfile: !!profile, role: profile?.role, loading })

    if (loading) {
        return null
    }

    // If logged in but no profile/role yet, redirect to selection
    if (!profile || !profile.role) {
        console.log('[DashboardPage] No profile/role found, redirecting to selection')
        return <Navigate to="/profile-selection" />
    }

    // New: If editor and missing onboarding data, force onboarding
    if (profile.role === 'editor' && !profile.portfolio_url && !window.location.pathname.includes('onboarding')) {
        return <Navigate to="/dashboard/editor/onboarding" />
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
                        <Route path="editor/onboarding" element={<EditorOnboarding />} />
                    </>
                )}

                {/* Catch-all to default dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </DashboardLayout>
    )
}

export default DashboardPage
