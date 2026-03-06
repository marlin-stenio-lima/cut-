import React from 'react'
import { Plus, Briefcase, Clock, CheckCircle, TrendingUp } from 'lucide-react'

const ClientDashboard: React.FC = () => {
    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Olá, Cliente! 👋</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Bem-vindo de volta ao seu centro de comando.</p>
                </div>
                <button className="glow-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px' }}>
                    <Plus size={20} /> Novo Projeto
                </button>
            </header>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
                {[
                    { label: 'Projetos Ativos', value: '3', icon: <Briefcase className="accent-cyan" />, trend: '+1' },
                    { label: 'Em Revisão', value: '12', icon: <Clock style={{ color: '#fbbf24' }} />, trend: 'Em dia' },
                    { label: 'Finalizados', value: '48', icon: <CheckCircle style={{ color: '#22c55e' }} />, trend: '+5' },
                    { label: 'Investimento', value: 'R$ 4.2k', icon: <TrendingUp style={{ color: 'var(--primary)' }} />, trend: 'Mensal' },
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
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>Ver todos</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                        { name: 'Youtube Video - Podcast Ep 04', editor: 'Lucas Silva', status: 'Em Edição', progress: 65 },
                        { name: 'Instagram Reels - Lançamento', editor: 'Ana Oliveira', status: 'Revisão', progress: 90 },
                        { name: 'Cinematic Teaser - Produto X', editor: 'Pendente', status: 'Aguardando', progress: 0 },
                    ].map((project, i) => (
                        <div key={i} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr 1fr',
                            alignItems: 'center',
                            padding: '16px',
                            borderRadius: '16px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.03)'
                        }}>
                            <div style={{ fontWeight: 600 }}>{project.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Editor: {project.editor}</div>
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
            </div>
        </div>
    )
}

export default ClientDashboard
