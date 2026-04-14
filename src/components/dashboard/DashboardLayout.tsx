import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Logo from '../common/Logo'
import {
    LayoutDashboard,
    Video,
    MessageSquare,
    Settings,
    LogOut,
    PlusCircle,
    Briefcase,
    Menu,
    X,
    Sun,
    Moon,
    Shield,
    Users,
    Wallet,
    TrendingUp,
    Filter,
    Phone
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

interface DashboardLayoutProps {
    children: React.ReactNode
    role: 'client' | 'editor' | 'admin'
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
    const { signOut, user } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

    // Close mobile menu on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [location.pathname])

    const navItems = role === 'client' ? [
        { icon: <LayoutDashboard size={20} />, label: 'Visão Geral', path: '/dashboard' },
        { icon: <PlusCircle size={20} />, label: 'Novo Projeto', path: '/dashboard/new-project' },
        { icon: <Briefcase size={20} />, label: 'Meus Projetos', path: '/dashboard/projects' },
        { icon: <Users size={20} />, label: 'Marketplace', path: '/dashboard/marketplace' },
        { icon: <MessageSquare size={20} />, label: 'Mensagens', path: '/dashboard/chat' },
    ] : role === 'editor' ? [
        { icon: <LayoutDashboard size={20} />, label: 'Home', path: '/dashboard' },
        { icon: <Video size={20} />, label: 'Explorar Projetos', path: '/dashboard/explore' },
        { icon: <Briefcase size={20} />, label: 'Minhas Edições', path: '/dashboard/work' },
        { icon: <Wallet size={20} />, label: 'Carteira / Banco', path: '/dashboard/bank' },
        { icon: <MessageSquare size={20} />, label: 'Mensagens', path: '/dashboard/chat' },
    ] : [
        // Admin Navigation
        { icon: <LayoutDashboard size={20} />, label: 'Visão Geral', path: '/dashboard' },
        { icon: <Shield size={20} />, label: 'Administração', path: '/dashboard/admin' },
        { icon: <Users size={20} />, label: 'Base Clientes', path: '/dashboard/admin/clients' },
        { icon: <TrendingUp size={20} />, label: 'Base Editores', path: '/dashboard/admin/editors' },
        { icon: <Filter size={20} />, label: 'CRM Projetos', path: '/dashboard/admin/crm' },
        { icon: <Phone size={20} />, label: 'Central WhatsApp', path: '/dashboard/admin/whatsapp' },
        { icon: <MessageSquare size={20} />, label: 'Mensagens', path: '/dashboard/chat' },
    ]

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-main)', flexDirection: 'column' }}>
            {/* Mobile Header */}
            <header className="mobile-header">
                <Logo size="sm" />
                <button
                    className="mobile-menu-btn"
                    onClick={() => setIsMobileMenuOpen(true)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}
                >
                    <Menu size={24} />
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            <div
                className={`menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
                {/* Sidebar */}
                <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{
                    width: '280px',
                    background: 'var(--bg-deep)',
                    backdropFilter: 'blur(20px)',
                    borderRight: '1px solid var(--glass-border)',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '32px 24px', // Standardized Top Padding
                    position: 'fixed',
                    height: '100vh',
                    zIndex: 100,
                    top: 0,
                    left: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', padding: '0 8px' }}>
                        <Logo />
                        {/* Close button only visible on mobile */}
                        <button
                            className="close-menu-btn"
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: isMobileMenuOpen ? 'block' : 'none' }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    color: location.pathname === item.path ? 'var(--text-main)' : 'var(--text-muted)',
                                    background: location.pathname === item.path ? 'var(--bg-card)' : 'transparent',
                                    border: location.pathname === item.path ? '1px solid var(--glass-border)' : '1px solid transparent',
                                    transition: 'all 0.2s',
                                    fontWeight: location.pathname === item.path ? 600 : 400
                                }}
                                className={location.pathname === item.path ? 'active-nav' : ''}
                            >
                                <span style={{ color: location.pathname === item.path ? 'var(--primary)' : 'inherit' }}>{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
                        <button
                            onClick={toggleTheme}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                color: 'var(--text-muted)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                fontSize: '1rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                        </button>
                        <Link to="/dashboard/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-muted)' }}>
                            <Settings size={20} /> Configurações
                        </Link>
                        <button
                            onClick={() => signOut()}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                color: '#ef4444',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                fontSize: '1rem'
                            }}
                        >
                            <LogOut size={20} /> Sair
                        </button>

                        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                {user?.email?.[0].toUpperCase()}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{role}</div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default DashboardLayout
