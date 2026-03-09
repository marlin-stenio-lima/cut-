import React, { useState, useEffect } from 'react';
import { Video, Loader2, Filter, Search, X, Send, ExternalLink, FileText, Play } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import VideoModal from '../../../components/dashboard/VideoModal';

const ExplorePage: React.FC = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [appliedProjectIds, setAppliedProjectIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    // Proposal Modal State
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
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
            window.open(url, '_blank');
        } finally {
            setDownloadingFile(null);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            try {
                // 1. Fetch open projects
                const { data: projectsData, error: projectsError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('status', 'Aberto')
                    .is('editor_id', null)
                    .order('created_at', { ascending: false });

                if (projectsError) throw projectsError;

                // 2. Fetch my proposals
                const { data: proposalsData, error: proposalsError } = await supabase
                    .from('proposals')
                    .select('project_id')
                    .eq('editor_id', user.id);

                if (proposalsError) throw proposalsError;

                const appliedIds = new Set(proposalsData?.map(p => p.project_id) || []);

                setProjects(projectsData || []);
                setAppliedProjectIds(appliedIds);

            } catch (err: any) {
                console.error('Error loading explore data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    const openProposalModal = (project: any) => {
        setSelectedProject(project);
        setCoverLetter('');
    };

    const closeProposalModal = () => {
        setSelectedProject(null);
        setCoverLetter('');
    };

    const submitProposal = async () => {
        if (!user || !selectedProject || !coverLetter.trim()) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('proposals')
                .insert({
                    project_id: selectedProject.id,
                    editor_id: user.id,
                    cover_letter: coverLetter.trim()
                });

            if (error) {
                if (error.code === '23505') { // Unique violation
                    alert('Você já enviou uma proposta para este projeto.');
                } else {
                    throw error;
                }
            } else {
                // Success
                setAppliedProjectIds(prev => new Set(prev).add(selectedProject.id));
                alert('Proposta enviada com sucesso!');
                closeProposalModal();
            }
        } catch (error: any) {
            console.error('Error submitting proposal:', error);
            alert(`Erro ao enviar proposta: ${error.message}`);
        } finally {
            setIsSubmitting(false);
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
                    {projects.map((project) => {
                        const hasApplied = appliedProjectIds.has(project.id);

                        return (
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
                                    <span style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}> {project.video_type} </span>
                                    <span style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}> {project.format} </span>
                                    <span style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}> {project.style} </span>
                                </div>

                                {/* Project Resources Preview */}
                                {(project.ryver_link || (project.project_files && project.project_files.length > 0)) && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        {project.ryver_link && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <ExternalLink size={14} color="var(--accent)" />
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RYVER:</span>
                                                <a href={project.ryver_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {project.ryver_link}
                                                </a>
                                            </div>
                                        )}
                                        {project.project_files && project.project_files.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {project.project_files.map((file: any, idx: number) => {
                                                    const isVideo = file.name.match(/\.(mp4|webm|ogg|mov)$/i);
                                                    return (
                                                        <div key={idx} style={{
                                                            padding: '6px 10px',
                                                            background: 'rgba(7, 182, 213, 0.05)',
                                                            borderRadius: '8px',
                                                            fontSize: '0.75rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            color: 'var(--text-main)',
                                                            border: '1px solid rgba(7, 182, 213, 0.1)'
                                                        }}>
                                                            <FileText size={12} color="var(--accent)" />
                                                            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{file.name}</div>
                                                            {isVideo && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                                                                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                                                    title="Assistir"
                                                                >
                                                                    <Play size={12} fill="var(--accent)" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDownload(file.url, file.name); }}
                                                                disabled={downloadingFile === file.name}
                                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                                                title="Baixar"
                                                            >
                                                                {downloadingFile === file.name ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {hasApplied ? (
                                    <button
                                        className="btn-primary"
                                        style={{ width: '100%', marginTop: 'auto', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'default' }}
                                        disabled
                                    >
                                        Proposta Enviada
                                    </button>
                                ) : (
                                    <button
                                        className="btn-primary"
                                        style={{ width: '100%', marginTop: 'auto', outline: 'none' }}
                                        onClick={() => openProposalModal(project)}
                                    >
                                        Enviar Proposta
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Proposal Modal - Redesigned */}
            {selectedProject && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass" style={{
                        maxWidth: '850px', width: '100%', borderRadius: '24px', overflow: 'hidden',
                        display: 'flex', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                        animation: 'fadeIn 0.3s ease-out', border: '1px solid var(--glass-border)'
                    }}>
                        <button
                            onClick={closeProposalModal}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', padding: '8px', borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}
                        >
                            <X size={20} />
                        </button>

                        {/* Sidebar Summary */}
                        <div style={{ width: '300px', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid var(--glass-border)', padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Projeto</div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.3 }}>{selectedProject.title}</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(7, 182, 213, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                        <Play size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIPO</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedProject.video_type}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>ORÇAMENTO</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#22c55e' }}>R$ {selectedProject.budget}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                                        <Loader2 size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>PRAZO</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString('pt-BR') : 'A cobrar'}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', padding: '16px', borderRadius: '16px', background: 'rgba(7, 182, 213, 0.05)', border: '1px solid rgba(7, 182, 213, 0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', marginBottom: '8px' }}>
                                    <Play size={14} fill="var(--accent)" />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Dica do Expert</span>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                    Seja breve e foque em como sua edição vai valorizar o estilo deste projeto.
                                </p>
                            </div>
                        </div>

                        {/* Form Area */}
                        <div style={{ flex: 1, padding: '40px' }}>
                            <div style={{ marginBottom: '32px' }}>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>Sua Proposta</h2>
                                <p style={{ color: 'var(--text-muted)' }}>Descreva seu plano para este trabalho.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '300px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Apresentação</label>
                                    <span style={{ fontSize: '0.75rem', color: coverLetter.length > 500 ? '#ef4444' : 'var(--text-muted)' }}>{coverLetter.length}/1000</span>
                                </div>
                                <textarea
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Comece com uma saudação e conte um pouco sobre sua visão para este vídeo..."
                                    style={{
                                        flex: 1, width: '100%', padding: '20px', borderRadius: '16px',
                                        background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)',
                                        color: 'white', outline: 'none', resize: 'none', fontFamily: 'inherit',
                                        fontSize: '1rem', lineHeight: 1.6, transition: 'all 0.3s'
                                    }}
                                    onFocus={(e) => e.currentTarget.style.border = '1px solid var(--accent)'}
                                    onBlur={(e) => e.currentTarget.style.border = '1px solid var(--glass-border)'}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px' }}>
                                <button
                                    onClick={closeProposalModal}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={submitProposal}
                                    disabled={isSubmitting || !coverLetter.trim()}
                                    className="btn-primary"
                                    style={{
                                        padding: '14px 32px', borderRadius: '14px', fontSize: '0.95rem',
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        background: 'var(--primary)',
                                        opacity: (isSubmitting || !coverLetter.trim()) ? 0.5 : 1,
                                        boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)'
                                    }}
                                >
                                    {isSubmitting ? (
                                        <><Loader2 size={20} className="animate-spin" /> Enviando...</>
                                    ) : (
                                        <><Send size={20} /> Enviar Candidatura</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {previewFile && <VideoModal file={previewFile} onClose={() => setPreviewFile(null)} />}
        </div>
    );
};

export default ExplorePage;
