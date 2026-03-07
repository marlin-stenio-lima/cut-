import React, { useState, useEffect } from 'react';
import { Video, Loader2, Filter, Search } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const ExplorePage: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('status', 'Aberto')
                    .is('editor_id', null)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProjects(data || []);
            } catch (err: any) {
                console.error('Error loading projects to explore:', err);
            } finally {
                setLoading(false);
            }
        };

        loadProjects();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Loader2 className="animate-spin" size={32} color="var(--accent)" />
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div className="flex-responsive-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Video size={28} className="accent-cyan" /> Explorar Projetos
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>Encontre os projetos perfeitos para o seu estilo de edição.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar projetos..."
                            style={{
                                padding: '10px 16px 10px 40px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button className="glow-btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={18} /> Filtros
                    </button>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '24px' }}>
                    <Video size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Nenhum projeto disponível</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto' }}>
                        No momento não há nenhum projeto novo aguardando por editor. Volte mais tarde!
                    </p>
                </div>
            ) : (
                <div className="grid-responsive-2" style={{ gap: '24px' }}>
                    {projects.map((project) => (
                        <div key={project.id} className="glass" style={{
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            borderRadius: '16px',
                            transition: 'all 0.2s',
                        }}>
                            <div>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px' }}>{project.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {project.description}
                                </p>
                            </div>

                            <div className="flex-responsive-row" style={{ alignItems: 'flex-start', gap: '16px', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Orçamento</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
                                        {project.budget ? `R$ ${project.budget}` : 'A Combinar'}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Prazo</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fbbf24' }}>
                                        {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'A Combinar'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                <span style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', textTransform: 'capitalize' }}>
                                    {project.video_type}
                                </span>
                                <span style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', textTransform: 'capitalize' }}>
                                    {project.format}
                                </span>
                                <span style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', textTransform: 'capitalize' }}>
                                    {project.style}
                                </span>
                            </div>

                            <button
                                className="btn-primary"
                                style={{ width: '100%', marginTop: 'auto', outline: 'none' }}
                                onClick={() => alert('Em breve! O sistema de propostas estará disponível nas próximas atualizações.')}
                            >
                                Enviar Proposta
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExplorePage;
