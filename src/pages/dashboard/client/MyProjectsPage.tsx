import React, { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Briefcase, Loader2, Video, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyProjectsPage: React.FC = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadProjects = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('client_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProjects(data || []);
            } catch (err: any) {
                console.error('Error loading projects:', err);
                setError('Erro ao carregar projetos.');
            } finally {
                setLoading(false);
            }
        };

        loadProjects();
    }, [user]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Loader2 className="animate-spin" size={32} color="var(--accent)" />
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Briefcase size={28} className="accent-cyan" /> Meus Projetos
                </h2>
                <Link to="/dashboard/new-project" className="btn-primary" style={{ textDecoration: 'none' }}>
                    Criar Novo Projeto
                </Link>
            </div>

            {error ? (
                <div className="error-message">{error}</div>
            ) : projects.length === 0 ? (
                <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '24px' }}>
                    <Video size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Nenhum projeto ainda</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto' }}>
                        Você não possui nenhum projeto de edição no momento. Clique no botão acima para criar o seu primeiro briefing.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {projects.map((project) => (
                        <div key={project.id} className="glass" style={{
                            padding: '24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderRadius: '16px',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '4px' }}>{project.title}</h3>
                                <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <span>{new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
                                    <span>•</span>
                                    <span style={{ textTransform: 'capitalize' }}>{project.video_type}</span>
                                    <span>•</span>
                                    <span>{project.format}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <Clock size={16} /> Data Limite: {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Não definida'}
                                </div>
                                <span style={{
                                    padding: '6px 16px',
                                    borderRadius: '100px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    background: project.status === 'Aberto' ? 'rgba(7, 182, 213, 0.1)' :
                                        project.status === 'Em Edição' ? 'rgba(99, 102, 241, 0.1)' :
                                            project.status === 'Revisão' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                    color: project.status === 'Aberto' ? 'var(--accent)' :
                                        project.status === 'Em Edição' ? 'var(--primary)' :
                                            project.status === 'Revisão' ? '#fbbf24' : '#22c55e',
                                    border: `1px solid ${project.status === 'Aberto' ? 'rgba(7, 182, 213, 0.2)' : 'transparent'}`
                                }}>
                                    {project.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyProjectsPage;
