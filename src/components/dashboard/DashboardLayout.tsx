import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Video,
    MessageSquare,
    Settings,
    LogOut,
    PlusCircle,
    Briefcase,
    Menu,
    X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface DashboardLayoutProps {
    children: React.ReactNode
    role: 'client' | 'editor'
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
    const { signOut, user } = useAuth()
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
        { icon: <MessageSquare size={20} />, label: 'Mensagens', path: '/dashboard/chat' },
    ] : [
        { icon: <LayoutDashboard size={20} />, label: 'Home', path: '/dashboard' },
        { icon: <Video size={20} />, label: 'Explorar Projetos', path: '/dashboard/explore' },
        { icon: <Briefcase size={20} />, label: 'Minhas Edições', path: '/dashboard/work' },
        { icon: <MessageSquare size={20} />, label: 'Mensagens', path: '/dashboard/chat' },
    ]

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-main)', flexDirection: 'column' }}>
            {/* Mobile Header */}
            <header className="mobile-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 700 }}>
                    <img src="/logo.jpg" alt="Cut House" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
                    <span>Cut House</span>
                </div>
                <button
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
                    background: 'rgba(15, 15, 25, 0.5)',
                    backdropFilter: 'blur(10px)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '32px 20px',
                    position: 'fixed',
                    height: '100vh',
                    zIndex: 100,
                    top: 0,
                    left: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px', padding: '0 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.4rem', fontWeight: 700 }}>
                            <img src="/logo.jpg" alt="Cut House" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                            <span>Cut House</span>
                        </div>
                        {/* Close button only visible on mobile (handled by css implicitly because sidebar slides away but visually nice to have) */}
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
                                    background: location.pathname === item.path ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
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

                        <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
