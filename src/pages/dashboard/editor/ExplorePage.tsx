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
    const [offeredPrice, setOfferedPrice] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewFile, setPreviewFile] = useState<any | null>(null);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

    // Filter and Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
    const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set());

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
        setOfferedPrice(project.budget?.toString() || '');
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
                    cover_letter: coverLetter.trim(),
                    offered_price: offeredPrice ? Number(offeredPrice) : null
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

    const filteredProjects = projects.filter(project => {
        const matchesSearch =
            project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesType = selectedTypes.size === 0 || selectedTypes.has(project.video_type);
        const matchesFormat = selectedFormats.size === 0 || selectedFormats.has(project.format);

        return matchesSearch && matchesType && matchesFormat;
    });

    const toggleFilter = (set: Set<string>, val: string, setter: (s: Set<string>) => void) => {
        const newSet = new Set(set);
        if (newSet.has(val)) {
            newSet.delete(val);
        } else {
            newSet.add(val);
        }
        setter(newSet);
    };

    const uniqueTypes = Array.from(new Set(projects.map(p => p.video_type).filter(Boolean)));
    const uniqueFormats = Array.from(new Set(projects.map(p => p.format).filter(Boolean)));

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Loader2 className="animate-spin" size={32} color="var(--accent)" />
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '40px', paddingTop: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            <div className="flex-responsive-row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', gap: '24px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ padding: '10px', background: 'rgba(7, 182, 213, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={24} className="accent-cyan" />
                        </div>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                            Explorar Projetos
                        </h2>
                        {filteredProjects.length > 0 && (
                            <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'var(--primary)', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
                                {filteredProjects.length} {filteredProjects.length === 1 ? 'disponível' : 'disponíveis'}
                            </span>
                        )}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Encontre e candidate-se aos melhores projetos da nossa rede.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', minWidth: '240px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por título ou descrição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px 14px 48px',
                                borderRadius: '16px',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--text-main)',
                                outline: 'none',
                                transition: 'all 0.2s',
                                fontSize: '0.95rem'
                            }}
                            className="focus-glow"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="glow-btn"
                        style={{
                            background: showFilters ? 'var(--primary)' : 'var(--bg-card)',
                            color: showFilters ? 'white' : 'var(--text-main)',
                            border: '1px solid var(--glass-border)',
                            padding: '14px 20px',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 600
                        }}
                    >
                        {showFilters ? <X size={18} /> : <Filter size={18} />}
                        {showFilters ? 'Fechar' : 'Filtros'}
                        {(selectedTypes.size + selectedFormats.size) > 0 && (
                            <span style={{
                                background: showFilters ? 'white' : 'var(--primary)',
                                color: showFilters ? 'var(--primary)' : 'white',
                                width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {selectedTypes.size + selectedFormats.size}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Expansible Filter Bar */}
            {showFilters && (
                <div className="glass" style={{ padding: '24px', borderRadius: '24px', marginBottom: '32px', border: '1px solid var(--glass-border)', animation: 'slideDown 0.3s ease-out' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Tipo de Vídeo</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {uniqueTypes.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => toggleFilter(selectedTypes, type, setSelectedTypes)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem',
                                            background: selectedTypes.has(type) ? 'var(--accent)' : 'var(--tag-bg)',
                                            color: selectedTypes.has(type) ? 'black' : 'var(--text-main)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Formato</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {uniqueFormats.map(format => (
                                    <button
                                        key={format}
                                        onClick={() => toggleFilter(selectedFormats, format, setSelectedFormats)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem',
                                            background: selectedFormats.has(format) ? 'var(--accent)' : 'var(--tag-bg)',
                                            color: selectedFormats.has(format) ? 'black' : 'var(--text-main)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {format}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setSelectedTypes(new Set()); setSelectedFormats(new Set()); setSearchTerm(''); }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <X size={16} /> Limpar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {filteredProjects.length === 0 ? (
                <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '24px' }}>
                    <Video size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Nenhum projeto disponível</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto' }}>
                        No momento não há nenhum projeto novo aguardando por editor. Volte mais tarde!
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                    gap: '24px'
                }}>
                    {filteredProjects.map((project) => {
                        const hasApplied = appliedProjectIds.has(project.id);

                        return (
                            <div key={project.id} className="glass" style={{
                                padding: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                borderRadius: '24px',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--glass-border)'
                            }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.borderColor = 'rgba(7, 182, 213, 0.3)';
                                    e.currentTarget.style.background = 'rgba(7, 182, 213, 0.02)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '48px', height: '48px',
                                        borderRadius: '14px',
                                        background: 'linear-gradient(135deg, rgba(7, 182, 213, 0.2), rgba(99, 102, 241, 0.2))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <Play size={20} color="var(--accent)" fill="var(--accent)" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '4px' }}>
                                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{project.title}</h3>
                                            {hasApplied && (
                                                <div style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.14)', color: '#22c55e', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Candidatado</div>
                                            )}
                                        </div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {project.description}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(7, 182, 213, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FileText size={16} color="var(--accent)" />
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orçamento</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)' }}>
                                                {project.budget ? `R$ ${project.budget}` : 'Combinar'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Play size={16} color="#fbbf24" fill="#fbbf24" />
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prazo</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24' }}>
                                                {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Combinar'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {[project.video_type, project.format, project.style].filter(Boolean).map((tag, i) => (
                                        <span key={i} style={{
                                            padding: '6px 14px',
                                            borderRadius: '10px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: 'var(--tag-bg)',
                                            color: 'var(--tag-text)',
                                            border: '1px solid var(--glass-border)'
                                        }}> {tag} </span>
                                    ))}
                                </div>

                                {/* Project Resources Section */}
                                {(project.ryver_link || (project.project_files && project.project_files.length > 0)) && (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                        padding: '16px',
                                        background: 'rgba(7, 182, 213, 0.03)',
                                        borderRadius: '16px',
                                        border: '1px dotted rgba(7, 182, 213, 0.2)'
                                    }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recursos Disponíveis</div>

                                        {project.ryver_link && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <ExternalLink size={14} color="var(--accent)" />
                                                <a href={project.ryver_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                                                    Link do Ryver / Drive
                                                </a>
                                            </div>
                                        )}
                                        {project.project_files && project.project_files.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {project.project_files.map((file: any, idx: number) => {
                                                    const isVideo = file.name.match(/\.(mp4|webm|ogg|mov)$/i);
                                                    return (
                                                        <div key={idx} style={{
                                                            padding: '8px 12px',
                                                            background: 'rgba(255, 255, 255, 0.03)',
                                                            borderRadius: '10px',
                                                            fontSize: '0.75rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            color: 'var(--text-main)',
                                                            border: '1px solid rgba(255, 255, 255, 0.05)'
                                                        }}>
                                                            <FileText size={14} color="var(--text-muted)" />
                                                            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{file.name}</div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                {isVideo && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                                                                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                                                                    >
                                                                        <Play size={14} fill="var(--accent)" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDownload(file.url, file.name); }}
                                                                    disabled={downloadingFile === file.name}
                                                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                                                                >
                                                                    {downloadingFile === file.name ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    className={hasApplied ? "" : "btn-primary"}
                                    style={{
                                        width: '100%',
                                        marginTop: '12px',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        transition: 'all 0.2s',
                                        cursor: hasApplied ? 'default' : 'pointer',
                                        background: hasApplied ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                                        color: hasApplied ? 'var(--text-muted)' : 'white',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                    disabled={hasApplied}
                                    onClick={() => !hasApplied && openProposalModal(project)}
                                >
                                    {hasApplied ? 'Proposta Enviada' : <><Send size={20} /> Enviar Proposta</>}
                                </button>
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Descrição do Projeto</h4>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6, background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        {selectedProject.description || 'Sem descrição detalhada.'}
                                    </p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sua Proposta de Valor (R$)</label>
                                        <input 
                                            type="number"
                                            value={offeredPrice}
                                            onChange={(e) => setOfferedPrice(e.target.value)}
                                            placeholder="Ex: 250"
                                            style={{
                                                width: '100%', padding: '14px 16px', borderRadius: '12px',
                                                background: 'rgba(7, 182, 213, 0.05)', border: '1px solid var(--accent)',
                                                color: 'white', outline: 'none', fontSize: '1.2rem', fontWeight: 800
                                            }}
                                        />
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sugestão baseada no budget do cliente (R$ {selectedProject.budget})</span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Apresentação</label>
                                            <span style={{ fontSize: '0.75rem', color: coverLetter.length > 500 ? '#ef4444' : 'var(--text-muted)' }}>{coverLetter.length}/1000</span>
                                        </div>
                                        <textarea
                                            value={coverLetter}
                                            onChange={(e) => setCoverLetter(e.target.value)}
                                            placeholder="Conte por que você é o editor ideal..."
                                            style={{
                                                width: '100%', height: '120px', padding: '16px', borderRadius: '12px',
                                                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)',
                                                color: 'white', outline: 'none', resize: 'none', fontSize: '0.95rem'
                                            }}
                                        />
                                    </div>
                                </div>
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
