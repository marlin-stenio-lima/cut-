import React, { useState, useEffect } from 'react'
import { Zap, Target, Star, Loader2, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'

const EditorDashboard: React.FC = () => {
    const { user } = useAuth()
    const [isOnline, setIsOnline] = useState(true)
    const [marketplaceProjects, setMarketplaceProjects] = useState<any[]>([])
    const [myActiveProjects, setMyActiveProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadEditorData = async () => {
            if (!user) return
            try {
                // 1. Fetch available projects (Marketplace)
                const { data: marketplaceData, error: mError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('status', 'Aberto')
                    .is('editor_id', null)
                    .order('created_at', { ascending: false })
                    .limit(4)

                if (mError) throw mError
                setMarketplaceProjects(marketplaceData || [])

                // 2. Fetch my active projects
                const { data: activeData, error: aError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('editor_id', user.id)
                    .order('created_at', { ascending: false })

                if (aError) throw aError
                setMyActiveProjects(activeData || [])
            } catch (err: any) {
                console.error('Error loading editor dashboard:', err)
            } finally {
                setLoading(false)
            }
        }
        loadEditorData()
    }, [user])

    // Calculate metrics based on active/finished projects later when implemented, using placeholders for now
    const completedCount = 0
    const moneyEarned = 0

    const formattedEarnings = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
    }).format(moneyEarned)

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 className="animate-spin" size={32} color="var(--accent)" />
            </div>
        )
    }

    return (
        <div>
            <header className="flex-responsive-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                <div>
                    <h1 className="dashboard-header-title" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Olá, Editor! 🎨</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Prepare suas ferramentas, grandes projetos esperam por você.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isOnline ? '#22c55e' : 'var(--text-muted)' }}>
                        {isOnline ? 'Disponível' : 'Indisponível'}
                    </span>
                    <button
                        onClick={() => setIsOnline(!isOnline)}
                        style={{
                            width: '48px',
                            height: '24px',
                            borderRadius: '20px',
                            background: isOnline ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: '#000',
                            position: 'absolute',
                            top: '3px',
                            left: isOnline ? '27px' : '3px',
                            transition: 'all 0.3s'
                        }}></div>
                    </button>
                </div>
            </header>

            <div className="flex-responsive-row" style={{ gap: '32px' }}>
                {/* Main Content Area */}
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Marketplace Preview */}
                    <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Zap size={20} className="accent-cyan" /> Projetos em Destaque
                            </h2>
                            <button style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>Explorar todos</button>
                        </div>

                        <div className="grid-responsive-2" style={{ gap: '20px' }}>
                            {marketplaceProjects.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Nenhum projeto disponível no momento. Volte mais tarde!
                                </div>
                            ) : (
                                marketplaceProjects.map((job) => (
                                    <div key={job.id} style={{
                                        padding: '20px',
                                        borderRadius: '16px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '16px'
                                    }}>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{job.title}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
                                                R$ {job.budget || '0'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#fbbf24' }}>
                                                Prazo: {job.deadline ? new Date(job.deadline).toLocaleDateString('pt-BR') : 'A Combinar'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span style={{ fontSize: '0.7rem', textTransform: 'capitalize', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                                {job.video_type}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                                {job.format}
                                            </span>
                                        </div>
                                        <button
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                                            onClick={() => alert('Em breve! O sistema de propostas estará disponível nas próximas atualizações.')}
                                        >
                                            Candidatar-se
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Active Work */}
                    <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>Meus Projetos Ativos</h2>

                        {myActiveProjects.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <p style={{ color: 'var(--text-muted)' }}>Você não tem projetos ativos no momento. Explore o marketplace para começar!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {myActiveProjects.map((project) => (
                                    <div key={project.id} className="grid-responsive-4 list-responsive" style={{
                                        alignItems: 'center',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.03)'
                                    }}>
                                        <div style={{ fontWeight: 600 }}>{project.title}</div>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <Clock size={16} /> {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : '-'}
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

                {/* Sidebar Stats */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px' }}>Minhas Métricas</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { label: 'Avaliação Média', value: '4.9', icon: <Star size={16} fill="#FFD700" color="#FFD700" /> },
                                { label: 'Projetos Concluídos', value: completedCount.toString(), icon: <Target size={16} className="accent-cyan" /> },
                                { label: 'Ganhos no Mês', value: formattedEarnings, icon: <Zap size={16} style={{ color: 'var(--primary)' }} /> },
                            ].map((m, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        {m.icon} {m.label}
                                    </div>
                                    <div style={{ fontWeight: 700 }}>{m.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Últimas Mensagens</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>Nenhuma mensagem nova.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditorDashboard
