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
import MarketplacePage from './client/MarketplacePage'
import BankPage from './editor/BankPage'
import AdminDashboard from './AdminDashboard'
import AdminWhatsApp from './AdminWhatsApp'

const DashboardPage: React.FC = () => {
    const { profile, loading, user } = useAuth()

    console.log('[DashboardPage] Render:', { user: !!user, hasProfile: !!profile, role: profile?.role, loading })

    if (loading) {
        console.log('[DashboardPage] Loading state active...')
        return null
    }

    // Default to client if no role is explicitly set (fallback)
    const effectiveRole = profile?.role || 'client'

    // New: If editor and missing onboarding data, force onboarding
    if (effectiveRole === 'editor' && !profile?.portfolio_url && !profile?.onboarding_status && !window.location.pathname.includes('onboarding')) {
        return <Navigate to="/dashboard/editor/onboarding" />
    }

    // New: Block editors awaiting approval or rejected
    if (effectiveRole === 'editor' && profile?.onboarding_status !== 'approved') {
        console.log('[DashboardPage] Editor not approved yet, redirecting to thanks/status page')
        return <Navigate to="/register/thanks" replace />
    }

    const role = (profile?.onboarding_status === 'approved' ? 'editor' : effectiveRole) as 'client' | 'editor' | 'admin'

    return (
        <DashboardLayout role={role}>
            <Routes>
                {/* Default Dashboard Home */}
                <Route path="/" element={
                    role === 'client' ? <ClientDashboard /> : 
                    role === 'editor' ? <EditorDashboard /> : 
                    <AdminDashboard />
                } />

                {/* Shared Routes */}
                <Route path="chat" element={<ChatPage />} />
                <Route path="settings" element={<SettingsPage />} />

                {/* Client Only Routes */}
                {role === 'client' && (
                    <>
                        <Route path="new-project" element={<NewProjectPage />} />
                        <Route path="projects" element={<MyProjectsPage />} />
                        <Route path="marketplace" element={<MarketplacePage />} />
                    </>
                )}

                {/* Editor Only Routes */}
                {role === 'editor' && (
                    <>
                        <Route path="explore" element={<ExplorePage />} />
                        <Route path="work" element={<MyWorkPage />} />
                        <Route path="bank" element={<BankPage />} />
                        <Route path="editor/onboarding" element={<EditorOnboarding />} />
                    </>
                )}

                {/* Admin Only Routes */}
                {role === 'admin' && (
                    <>
                        <Route path="admin" element={<AdminDashboard />} />
                        <Route path="admin/leads" element={<AdminDashboard />} />
                        <Route path="admin/clients" element={<AdminDashboard />} />
                        <Route path="admin/editors" element={<AdminDashboard />} />
                        <Route path="admin/crm" element={<AdminDashboard />} />
                        <Route path="admin/whatsapp" element={<AdminWhatsApp />} />
                    </>
                )}

                {/* Catch-all to default dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </DashboardLayout>
    )
}

export default DashboardPage
