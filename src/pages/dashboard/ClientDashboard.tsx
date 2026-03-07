import React, { useEffect, useState } from 'react'
import { Plus, Briefcase, Clock, CheckCircle, TrendingUp, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'

const ClientDashboard: React.FC = () => {
    const { user } = useAuth()
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user) return
            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('client_id', user.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setProjects(data || [])
            } catch (err: any) {
                console.error('Error loading dashboard:', err)
            } finally {
                setLoading(false)
            }
        }
        loadDashboardData()
    }, [user])

    const activeProjects = projects.filter(p => !['Finalizado'].includes(p.status)).length
    const reviewProjects = projects.filter(p => p.status === 'Em Revisão').length
    const finishedProjects = projects.filter(p => p.status === 'Finalizado').length

    // Calculate total investment (sum of budgets)
    const totalInvestment = projects.reduce((acc, curr) => acc + (curr.budget || 0), 0)

    const formattedInvestment = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
    }).format(totalInvestment)

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 className="animate-spin" size={32} color="var(--accent)" />
            </div>
        )
    }

    const recentProjects = projects.slice(0, 4)
    return (
        <div>
            <header className="flex-responsive-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                <div>
                    <h1 className="dashboard-header-title" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Olá, Cliente! 👋</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Bem-vindo de volta ao seu centro de comando.</p>
                </div>
                <Link to="/dashboard/new-project" className="glow-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none' }}>
                    <Plus size={20} /> Novo Projeto
                </Link>
            </header>

            {/* Stats Grid */}
            <div className="grid-responsive-4" style={{ marginBottom: '48px' }}>
                {[
                    { label: 'Projetos Ativos', value: activeProjects, icon: <Briefcase className="accent-cyan" />, trend: 'Em Andamento' },
                    { label: 'Em Revisão', value: reviewProjects, icon: <Clock style={{ color: '#fbbf24' }} />, trend: 'Aguardando Aprovação' },
                    { label: 'Finalizados', value: finishedProjects, icon: <CheckCircle style={{ color: '#22c55e' }} />, trend: 'Sucesso' },
                    { label: 'Investimento', value: formattedInvestment, icon: <TrendingUp style={{ color: 'var(--primary)' }} />, trend: 'Total' },
                ].map((stat, i) => (
                    <div key={i} className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {stat.icon}
                            </div>
                            <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                {stat.trend}
                            </span>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '4px' }}>{stat.value}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Recent Projects */}
            <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Projetos Recentes</h2>
                    <Link to="/dashboard/projects" style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, textDecoration: 'none' }}>Ver todos</Link>
                </div>

                {recentProjects.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Você ainda não criou nenhum projeto. <Link to="/dashboard/new-project" style={{ color: 'var(--accent)' }}>Crie o seu primeiro</Link> para começar!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {recentProjects.map((project) => (
                            <div key={project.id} className="grid-responsive-4 list-responsive" style={{
                                alignItems: 'center',
                                padding: '16px',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.03)'
                            }}>
                                <div style={{ fontWeight: 600 }}>{project.title}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'capitalize' }}>{project.video_type}</div>
                                <div>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '100px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        background: project.status === 'Em Edição' ? 'rgba(99, 102, 241, 0.1)' : project.status === 'Revisão' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                        color: project.status === 'Em Edição' ? 'var(--primary)' : project.status === 'Revisão' ? '#fbbf24' : 'var(--text-muted)'
                                    }}>
                                        {project.status}
                                    </span>
                                </div>
                                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{ width: `${project.progress}%`, height: '100%', background: 'var(--accent)' }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{project.progress}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ClientDashboard
