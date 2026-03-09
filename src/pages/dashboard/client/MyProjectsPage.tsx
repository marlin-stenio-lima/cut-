import React, { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Briefcase, Loader2, Video, Clock, ChevronDown, ChevronUp, User, CheckCircle, ExternalLink, FileText, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import VideoModal from '../../../components/dashboard/VideoModal';

const MyProjectsPage: React.FC = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Proposals viewing state
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [projectProposals, setProjectProposals] = useState<any[]>([]);
    const [loadingProposals, setLoadingProposals] = useState(false);
    const [acceptingProposalId, setAcceptingProposalId] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<any | null>(null);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

    const handleDownload = async (url: string, fileName: string) => {
        try {
            setDownloadingFile(fileName);
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Error downloading file:', err);
            window.open(url, '_blank'); // Fallback to opening in new tab if download fails
        } finally {
            setDownloadingFile(null);
        }
    };

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

    const handleExpandProject = async (projectId: string) => {
        if (expandedProjectId === projectId) {
            setExpandedProjectId(null);
            return;
        }

        setExpandedProjectId(projectId);
        setLoadingProposals(true);

        try {
            // Fetch proposals and join with editor profile to get the name
            const { data, error } = await supabase
                .from('proposals')
                .select(`
                    *,
                    editor:profiles!editor_id(full_name)
                `)
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjectProposals(data || []);
        } catch (err: any) {
            console.error('Error loading proposals:', err);
            alert('Não foi possível carregar as propostas.');
        } finally {
            setLoadingProposals(false);
        }
    };

    const handleAcceptProposal = async (proposal: any, projectId: string) => {
        if (!confirm('Tem certeza que deseja aceitar esta proposta? Este editor será adicionado ao projeto.')) return;

        setAcceptingProposalId(proposal.id);

        try {
            // 1. Update the proposal status to 'accepted'
            const { error: propError } = await supabase
                .from('proposals')
                .update({ status: 'accepted' })
                .eq('id', proposal.id);

            if (propError) throw propError;

            // 2. Update the project status to 'Em Edição' and assign editor
            const { error: projError } = await supabase
                .from('projects')
                .update({
                    status: 'Em Edição',
                    editor_id: proposal.editor_id
                })
                .eq('id', projectId);

            if (projError) throw projError;

            // Update local state
            setProjects(prev => prev.map(p =>
                p.id === projectId ? { ...p, status: 'Em Edição', editor_id: proposal.editor_id } : p
            ));

            // Re-fetch proposals to update UI
            setProjectProposals(prev => prev.map(p =>
                p.id === proposal.id ? { ...p, status: 'accepted' } : p
            ));

            alert('Proposta aceita! O projeto agora está em andamento.');

        } catch (err: any) {
            console.error('Error accepting proposal:', err);
            alert(`Erro ao aceitar proposta: ${err.message}`);
        } finally {
            setAcceptingProposalId(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Loader2 className="animate-spin" size={32} color="var(--accent)" />
            </div>
        );
    }

    return (
        <div className="glass" style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0',
            overflow: 'hidden',
            border: 'none',
            animation: 'fadeIn 0.3s ease-out',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)'
        }}>
            <header style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '32px 40px',
                borderBottom: '1px solid var(--glass-border)',
                background: 'rgba(0, 0, 0, 0.05)',
                flexShrink: 0
            }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    <Briefcase size={28} className="accent-cyan" /> Meus Projetos
                </h2>
                <Link to="/dashboard/new-project" className="btn-primary" style={{ textDecoration: 'none' }}>
                    Criar Novo Projeto
                </Link>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>

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
                            <div key={project.id} className="glass" style={{ borderRadius: '16px', overflow: 'hidden', transition: 'all 0.2s' }}>
                                <div
                                    onClick={() => handleExpandProject(project.id)}
                                    style={{
                                        padding: '24px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        background: expandedProjectId === project.id ? 'rgba(255,255,255,0.02)' : 'transparent'
                                    }}
                                >
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {project.title}
                                        </h3>
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
                                            <Clock size={16} /> Prazo: {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Livre'}
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
                                        {expandedProjectId === project.id ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                                    </div>
                                </div>

                                {/* Project Details & Resources */}
                                <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {project.ryver_link && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(7, 182, 213, 0.05)', borderRadius: '12px', border: '1px solid rgba(7, 182, 213, 0.1)' }}>
                                            <ExternalLink size={18} color="var(--accent)" />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Link do Ryver</div>
                                                <a href={project.ryver_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                                                    {project.ryver_link}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {project.project_files && project.project_files.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {project.project_files.map((file: any, idx: number) => (
                                                <div key={idx} style={{
                                                    padding: '8px 12px',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.8rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    color: 'var(--text-main)',
                                                    border: '1px solid var(--glass-border)'
                                                }}>
                                                    <FileText size={14} color="var(--accent)" /> {file.name}
                                                    {file.type?.startsWith('video/') || file.name.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                                                                style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                                                            >
                                                                <Play size={10} fill="white" /> Assistir
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDownload(file.url, file.name); }}
                                                                disabled={downloadingFile === file.name}
                                                                style={{
                                                                    padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px',
                                                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                                                    borderRadius: '4px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600
                                                                }}
                                                            >
                                                                {downloadingFile === file.name ? <Loader2 size={10} className="animate-spin" /> : null}
                                                                Baixar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDownload(file.url, file.name); }}
                                                            disabled={downloadingFile === file.name}
                                                            style={{
                                                                background: 'none', border: 'none', fontSize: '0.75rem',
                                                                color: 'var(--accent)', cursor: 'pointer', fontWeight: 600,
                                                                display: 'flex', alignItems: 'center', gap: '4px'
                                                            }}
                                                        >
                                                            {downloadingFile === file.name ? <Loader2 size={10} className="animate-spin" /> : null}
                                                            Baixar
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Expanded Area: Proposals */}
                                {expandedProjectId === project.id && (
                                    <div style={{ padding: '0 24px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                                        <h4 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            Propostas Recebidas
                                        </h4>

                                        {loadingProposals ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                                <Loader2 size={16} className="animate-spin" /> Carregando propostas...
                                            </div>
                                        ) : projectProposals.length === 0 ? (
                                            <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                Nenhuma proposta recebida para este projeto ainda.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {projectProposals.map((proposal) => (
                                                    <div key={proposal.id} style={{
                                                        padding: '20px',
                                                        background: 'rgba(0,0,0,0.3)',
                                                        border: `1px solid ${proposal.status === 'accepted' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '16px'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <User size={20} color="var(--text-muted)" />
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{proposal.editor?.full_name || 'Alguém'}</div>
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enviada em {new Date(proposal.created_at).toLocaleDateString('pt-BR')}</div>
                                                                </div>
                                                            </div>

                                                            {proposal.status === 'accepted' ? (
                                                                <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                                                                    <CheckCircle size={16} />
                                                                    Aceita
                                                                </span>
                                                            ) : project.status === 'Aberto' ? (
                                                                <button
                                                                    className="btn-primary"
                                                                    onClick={() => handleAcceptProposal(proposal, project.id)}
                                                                    disabled={acceptingProposalId === proposal.id}
                                                                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                                                >
                                                                    {acceptingProposalId === proposal.id ? 'Aceitando...' : 'Aceitar e Contratar'}
                                                                </button>
                                                            ) : null}
                                                        </div>

                                                        <div style={{ background: 'rgba(0, 0, 0, 0.05)', padding: '16px', borderRadius: '8px', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
                                                            {proposal.cover_letter}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {previewFile && <VideoModal file={previewFile} onClose={() => setPreviewFile(null)} />}
        </div>
    );
};

export default MyProjectsPage;
