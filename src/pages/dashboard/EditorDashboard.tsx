import React, { useState } from 'react'
import { Zap, Target, Star } from 'lucide-react'

const EditorDashboard: React.FC = () => {
    const [isOnline, setIsOnline] = useState(true)

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Olá, Editor! 🎨</h1>
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

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Marketplace Preview */}
                    <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Zap size={20} className="accent-cyan" /> Projetos em Destaque
                            </h2>
                            <button style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>Explorar todos</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {[
                                { title: 'Vlog de Viagem - Japão', price: 'R$ 800', deadline: '3 dias', tags: ['Premiere', 'Color Grade'] },
                                { title: 'Comercial Tech SaaS', price: 'R$ 1.500', deadline: '5 dias', tags: ['After Effects', 'Motion'] },
                            ].map((job, i) => (
                                <div key={i} style={{
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
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>{job.price}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#fbbf24' }}>Prazo: {job.deadline}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {job.tags.map(tag => (
                                            <span key={tag} style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{tag}</span>
                                        ))}
                                    </div>
                                    <button style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                                        Candidatar-se
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Work */}
                    <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>Meus Projetos Ativos</h2>
                        <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>Você não tem projetos ativos no momento. Explore o marketplace para começar!</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px' }}>Minhas Métricas</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { label: 'Avaliação Média', value: '4.9', icon: <Star size={16} fill="#FFD700" color="#FFD700" /> },
                                { label: 'Projetos Concluídos', value: '32', icon: <Target size={16} className="accent-cyan" /> },
                                { label: 'Ganhos no Mês', value: 'R$ 2.450', icon: <Zap size={16} style={{ color: 'var(--primary)' }} /> },
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
