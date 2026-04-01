import React, { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Briefcase, Loader2, Video, Clock, MessageSquare, Play, FileText, ExternalLink, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../../context/ModalContext';
import VideoModal from '../../../components/dashboard/VideoModal';

const MyWorkPage: React.FC = () => {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<any | null>(null);
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    const [isFinishing, setIsFinishing] = useState<string | null>(null);

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
            window.open(url, '_blank');
        } finally {
            setDownloadingFile(null);
        }
    };

    const loadMyWork = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Fetch projects where I am the editor
            const { data: assignedProjects, error: assignedError } = await supabase
                .from('projects')
                .select('*, client:profiles!client_id(full_name)')
                .eq('editor_id', user.id);

            if (assignedError) throw assignedError;

            // 2. Fetch projects where I sent a proposal but am not yet assigned
            const { data: myProposals, error: proposalsError } = await supabase
                .from('proposals')
                .select('project:projects(*, client:profiles!client_id(full_name))')
                .eq('editor_id', user.id)
                .eq('status', 'pending');

            if (proposalsError) throw proposalsError;

            const proposalProjects = myProposals?.map(p => ({ ...p.project, is_negotiation: true })) || [];
            const allProjects = [...(assignedProjects || []), ...proposalProjects];

            // Sort by creation date
            allProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setProjects(allProjects);
        } catch (err: any) {
            console.error('Error loading my work:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMyWork();
    }, [user]);

    const handleFinishProject = async (projectId: string) => {
        const confirmed = await showConfirm(
            'Finalizar Entrega?',
            'Deseja marcar este projeto como concluído e enviar para revisão do cliente?'
        );
        if (!confirmed) return;
        
        setIsFinishing(projectId);
        try {
            const { error } = await supabase
                .from('projects')
                .update({
                    status: 'Aguardando Pagamento', // Using a confirmed valid status in the DB constraint
                    editor_finished_at: new Date().toISOString()
                })
                .eq('id', projectId);

            if (error) throw error;

            showAlert('Trabalho Entregue!', 'O projeto foi enviado para o cliente. Parabéns pela entrega!', 'success');
            loadMyWork();
        } catch (err: any) {
            showAlert('Erro na Entrega', `Não foi possível finalizar: ${err.message}`, 'error');
        } finally {
            setIsFinishing(null);
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
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Briefcase size={28} className="accent-cyan" /> Minhas Edições
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>Visualize seus projetos em andamento e propostas enviadas.</p>
            </div>

            {projects.length === 0 ? (
                <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '24px' }}>
                    <Video size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Nenhum projeto ainda</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto' }}>
                        Você ainda não possui projetos em andamento ou propostas pendentes.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {projects.map((project) => (
                        <div key={project.id} className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                            <div
                                onClick={() => setExpandedProjectId(expandedProjectId === project.id ? null : project.id)}
                                style={{
                                    padding: '24px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    background: expandedProjectId === project.id ? 'rgba(255,255,255,0.02)' : 'transparent'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: project.is_negotiation ? 'rgba(251, 191, 36, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: project.is_negotiation ? '#fbbf24' : '#22c55e'
                                    }}>
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '4px' }}>{project.title}</h3>
                                        <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <span>Cliente: {project.client?.full_name || 'Desconhecido'}</span>
                                            <span>•</span>
                                            <span style={{ color: project.is_negotiation ? '#fbbf24' : '#22c55e', fontWeight: 600 }}>
                                                {project.is_negotiation ? 'Proposta Enviada' : project.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {project.status === 'Em Edição' && !project.is_negotiation && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFinishProject(project.id);
                                                }}
                                                disabled={isFinishing === project.id}
                                                className="btn-primary"
                                                style={{ padding: '8px 16px', background: '#22c55e', fontSize: '0.85rem' }}
                                            >
                                                {isFinishing === project.id ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={16} /> Entregar Edição</>}
                                            </button>
                                        )}
                                        <button
                                            className="btn-secondary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate('/dashboard/chat');
                                            }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px' }}
                                        >
                                            <MessageSquare size={18} /> Chat
                                        </button>
                                        {expandedProjectId === project.id ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                                    </div>
                            </div>

                            {expandedProjectId === project.id && (
                                <div style={{ padding: '0 24px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Tipo de Vídeo</div>
                                            <div style={{ fontWeight: 600 }}>{project.video_type}</div>
                                        </div>
                                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Orçamento</div>
                                            <div style={{ fontWeight: 600, color: 'var(--accent)' }}>R$ {project.budget}</div>
                                        </div>
                                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Prazo</div>
                                            <div style={{ fontWeight: 600 }}>{project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'A combinar'}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Recursos e Briefing</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {project.ryver_link && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(7, 182, 213, 0.05)', borderRadius: '12px', border: '1px solid rgba(7, 182, 213, 0.1)' }}>
                                                    <ExternalLink size={18} color="var(--accent)" />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>GOOGLE DRIVE / RYVER</div>
                                                        <a href={project.ryver_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                                                            {project.ryver_link}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {project.project_files?.map((file: any, idx: number) => {
                                                    const isVideo = file.name.match(/\.(mp4|webm|ogg|mov)$/i);
                                                    return (
                                                        <div key={idx} style={{
                                                            padding: '10px 16px',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            borderRadius: '10px',
                                                            fontSize: '0.85rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            color: 'var(--text-main)',
                                                            border: '1px solid var(--glass-border)'
                                                        }}>
                                                            <FileText size={16} color="var(--accent)" />
                                                            <div style={{ flex: 1 }}>{file.name}</div>

                                                            {isVideo ? (
                                                                project.is_negotiation ? (
                                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                                                                        Bloqueado (Aguardando aceite)
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                        <button
                                                                            className="btn-primary"
                                                                            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                                            onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                                                                        >
                                                                            <Play size={12} fill="white" /> Assistir
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleDownload(file.url, file.name); }}
                                                                            disabled={downloadingFile === file.name}
                                                                            style={{
                                                                                padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px',
                                                                                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                                                                borderRadius: '6px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600
                                                                            }}
                                                                        >
                                                                            {downloadingFile === file.name ? <Loader2 size={12} className="animate-spin" /> : null}
                                                                            Baixar
                                                                        </button>
                                                                    </div>
                                                                )
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
                                                                    {downloadingFile === file.name ? <Loader2 size={12} className="animate-spin" /> : null}
                                                                    Baixar
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {previewFile && (
                <VideoModal
                    file={previewFile}
                    status={projects.find(p => p.id === expandedProjectId)?.status}
                    onClose={() => setPreviewFile(null)}
                />
            )}
        </div>
    );
};

export default MyWorkPage;
