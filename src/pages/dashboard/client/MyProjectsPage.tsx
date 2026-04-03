import React, { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../context/ModalContext';
import { Briefcase, Loader2, Video, Clock, ChevronDown, ChevronUp, CheckCircle, ExternalLink, FileText, Play, Send, Star, Pencil, X, Upload, Trash2, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import VideoModal from '../../../components/dashboard/VideoModal';
import EditorPortfolioModal from '../../../components/dashboard/EditorPortfolioModal';

const MyProjectsPage: React.FC = () => {
    const { user } = useAuth();
    const { showAlert, showConfirm, showToast } = useModal();
    const navigate = useNavigate();
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
    const [selectedEditor, setSelectedEditor] = useState<any | null>(null);
    
    // Negotiation state
    const [showCounterModal, setShowCounterModal] = useState<{ proposalId: string, projectId: string } | null>(null);
    const [counterPrice, setCounterPrice] = useState('');
    const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);

    // Completion state
    const [showReviewModal, setShowReviewModal] = useState<any | null>(null);
    const [reviewText, setReviewText] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Edit project state
    const [showEditModal, setShowEditModal] = useState<any | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editRyverLink, setEditRyverLink] = useState('');
    const [editDeadline, setEditDeadline] = useState('');
    const [editFiles, setEditFiles] = useState<any[]>([]);
    const [isUploadingEdit, setIsUploadingEdit] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

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
        } catch (err: any) {
            console.error('Error downloading file:', err);
            window.open(url, '_blank');
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
            const { data, error } = await supabase
                .from('proposals')
                .select(`
                    *,
                    editor:profiles!editor_id(*)
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
        const finalPrice = proposal.counter_price || proposal.offered_price || 0;
        
        const confirmed = await showConfirm(
            'Confirmar Contratação',
            `Confirmar contratação por R$ ${finalPrice}? O valor será reservado da sua carteira.`
        );
        if (!confirmed) return;

        setAcceptingProposalId(proposal.id);

        try {
            const { data: profile, error: profErr } = await supabase
                .from('profiles')
                .select('balance, frozen_balance')
                .eq('id', user?.id)
                .single();
            
            if (profErr) throw profErr;

            if (Number(profile.balance) < Number(finalPrice)) {
                const missing = Number(finalPrice) - Number(profile.balance);
                const goToRecharge = await showConfirm(
                    'Saldo Insuficiente',
                    `Você tem R$ ${profile.balance}, mas o projeto custa R$ ${finalPrice}. Deseja recarregar R$ ${missing} para continuar?`
                );
                if (goToRecharge) {
                    navigate(`/dashboard?deposit=true&amount=${missing}`);
                }
                return;
            }

            const { error: balanceErr } = await supabase
                .from('profiles')
                .update({
                    balance: Number(profile.balance) - Number(finalPrice),
                    frozen_balance: Number(profile.frozen_balance || 0) + Number(finalPrice)
                })
                .eq('id', user?.id);
            
            if (balanceErr) throw balanceErr;

            const { error: propError } = await supabase
                .from('proposals')
                .update({ status: 'accepted' })
                .eq('id', proposal.id);

            if (propError) throw propError;

            const { error: projError } = await supabase
                .from('projects')
                .update({
                    status: 'Em Edição',
                    editor_id: proposal.editor_id,
                    final_price: finalPrice
                })
                .eq('id', projectId);

            if (projError) throw projError;

            await supabase.from('wallet_transactions').insert({
                user_id: user?.id,
                amount: finalPrice,
                type: 'ESCROW_LOCK',
                status: 'SUCCESS',
                description: `Valor reservado para o projeto: ${projects.find(p => p.id === projectId)?.title}`
            });

            setProjects(prev => prev.map(p =>
                p.id === projectId ? { ...p, status: 'Em Edição', editor_id: proposal.editor_id, final_price: finalPrice } : p
            ));

            showAlert('Sucesso!', 'Contratação realizada! O saldo foi reservado e o editor avisado.', 'success');

        } catch (err: any) {
            console.error('Error accepting proposal:', err);
            showAlert('Erro', `Erro no processo: ${err.message}`, 'error');
        } finally {
            setAcceptingProposalId(null);
        }
    };

    const handleCounterOffer = async () => {
        if (!showCounterModal || !counterPrice) return;
        setIsSubmittingCounter(true);

        try {
            const { data: currentProp } = await supabase
                .from('proposals')
                .select('negotiation_round')
                .eq('id', showCounterModal.proposalId)
                .single();

            const nextRound = (currentProp?.negotiation_round || 1) + 1;

            const { error } = await supabase
                .from('proposals')
                .update({
                    counter_price: Number(counterPrice),
                    negotiation_round: nextRound,
                    last_sender_id: user?.id
                })
                .eq('id', showCounterModal.proposalId);

            if (error) throw error;

            showToast('Contraproposta enviada!', 'success');
            setShowCounterModal(null);
            setCounterPrice('');
            handleExpandProject(showCounterModal.projectId);

        } catch (err: any) {
            alert(`Erro ao enviar contraproposta: ${err.message}`);
        } finally {
            setIsSubmittingCounter(false);
        }
    };

    const handleFinishProject = async () => {
        if (!showReviewModal || !reviewText.trim()) return;
        setIsSubmittingReview(true);

        try {
            const { error } = await supabase
                .from('projects')
                .update({
                    client_finished_at: new Date().toISOString(),
                    client_review: reviewText.trim(),
                    status: 'Aguardando Pagamento'
                })
                .eq('id', showReviewModal.id);

            if (error) throw error;

            showAlert('Concluído', 'Projeto finalizado do seu lado! Agora o Admin irá liberar o pagamento para o editor.', 'success');
            setShowReviewModal(null);
            setReviewText('');
            const { data } = await supabase.from('projects').select('*').eq('client_id', user?.id).order('created_at', { ascending: false });
            setProjects(data || []);

        } catch (err: any) {
            alert(`Erro ao finalizar: ${err.message}`);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleOpenEditModal = (project: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setShowEditModal(project);
        setEditDescription(project.description || '');
        setEditRyverLink(project.ryver_link || '');
        setEditDeadline(project.deadline || '');
        setEditFiles(project.project_files || []);
    };

    const handleEditFileUpload = async (fileList: FileList) => {
        if (!user || !fileList.length) return;
        setIsUploadingEdit(true);
        try {
            const newFiles = [...editFiles];
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                if (file.size > 500 * 1024 * 1024) { alert(`O arquivo ${file.name} ultrapassa 500MB.`); continue; }
                const fileName = `${Date.now()}-${file.name}`;
                const { data: uploadData, error: uploadErr } = await supabase.storage
                    .from('project-files')
                    .upload(`${user.id}/${fileName}`, file, { upsert: false });
                if (uploadErr) throw uploadErr;
                if (uploadData) newFiles.push({ name: file.name, path: uploadData.path, size: file.size, type: file.type });
            }
            setEditFiles(newFiles);
        } catch (err: any) {
            alert(`Erro no upload: ${err.message}`);
        } finally {
            setIsUploadingEdit(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!showEditModal) return;
        setIsSavingEdit(true);
        try {
            const { error } = await supabase
                .from('projects')
                .update({ 
                    description: editDescription, 
                    ryver_link: editRyverLink, 
                    deadline: editDeadline || null,
                    project_files: editFiles 
                })
                .eq('id', showEditModal.id);
            if (error) throw error;
            setProjects(prev => prev.map(p =>
                p.id === showEditModal.id
                    ? { ...p, description: editDescription, ryver_link: editRyverLink, deadline: editDeadline || null, project_files: editFiles }
                    : p
            ));
            setShowEditModal(null);
            showToast('Projeto atualizado!', 'success');
        } catch (err: any) {
            alert(`Erro ao salvar: ${err.message}`);
        } finally {
            setIsSavingEdit(false);
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
                                                (project.status === 'Revisão' || project.status === 'Aguardando Pagamento') ? 'rgba(251, 191, 36, 0.1)' : 
                                                'rgba(34, 197, 94, 0.1)',
                                            color: project.status === 'Aberto' ? 'var(--accent)' :
                                                project.status === 'Em Edição' ? 'var(--primary)' :
                                                (project.status === 'Revisão' || project.status === 'Aguardando Pagamento') ? '#fbbf24' : 
                                                '#22c55e',
                                            border: `1px solid ${project.status === 'Aberto' ? 'rgba(7, 182, 213, 0.2)' : 'transparent'}`
                                        }}>
                                            {project.status === 'Aguardando Pagamento' ? 'Revisão' : project.status}
                                        </span>
                                        {project.status === 'Aberto' && (
                                            <button
                                                onClick={(e) => handleOpenEditModal(project, e)}
                                                title="Editar projeto"
                                                style={{
                                                    width: '34px', height: '34px', borderRadius: '10px',
                                                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                                                    color: 'var(--primary)', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <Pencil size={15} />
                                            </button>
                                        )}
                                        {(project.status === 'Revisão' || project.status === 'Aguardando Pagamento') && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowReviewModal(project);
                                                }}
                                                className="btn-primary" 
                                                style={{ padding: '6px 16px', fontSize: '0.8rem', background: '#22c55e' }}
                                            >
                                                Finalizar e Liberar
                                            </button>
                                        )}
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
                                                                onClick={(e) => { e.stopPropagation(); setPreviewFile({ ...file, projectStatus: project.status }); }}
                                                                style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                                                            >
                                                                <Play size={10} fill="white" /> Assistir
                                                            </button>
                                                            {project.status === 'Concluído' && (
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
                                                            )}
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
                                                {projectProposals.map((proposal) => {
                                                    const editorPrice = Number(proposal.counter_price || proposal.offered_price || project.budget);
                                                    const budget = Number(project.budget);
                                                    const hasCustomPrice = !!(proposal.offered_price || proposal.counter_price);
                                                    const priceDiff = hasCustomPrice ? editorPrice - budget : 0;
                                                    const isAbove = priceDiff > 0;
                                                    const priceColor = !hasCustomPrice ? '#4ade80' : isAbove ? '#fbbf24' : '#4ade80';
                                                    const editorInitial = (proposal.editor?.full_name || 'E')[0].toUpperCase();

                                                    return (
                                                    <div key={proposal.id} style={{
                                                        borderRadius: '20px',
                                                        overflow: 'hidden',
                                                        border: `1px solid ${proposal.status === 'accepted' ? 'rgba(34,197,94,0.25)' : isAbove ? 'rgba(251,191,36,0.15)' : 'rgba(99,102,241,0.2)'}`,
                                                        background: proposal.status === 'accepted'
                                                            ? 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(0,0,0,0.3) 100%)'
                                                            : 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(0,0,0,0.3) 100%)',
                                                        backdropFilter: 'blur(10px)',
                                                    }}>
                                                        <div style={{
                                                            height: '3px',
                                                            background: proposal.status === 'accepted'
                                                                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                                                                : isAbove
                                                                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                                                    : 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                                                        }} />

                                                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                                    <div style={{
                                                                        width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                                                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontWeight: 800, fontSize: '1.1rem', color: 'white',
                                                                        boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
                                                                    }}>
                                                                        {editorInitial}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '2px' }}>
                                                                            {proposal.editor?.full_name || 'Editor'}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <Clock size={11} />
                                                                            {new Date(proposal.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                            {proposal.negotiation_round > 1 && (
                                                                                <span style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: '0.68rem', padding: '1px 7px', borderRadius: '100px', fontWeight: 700 }}>
                                                                                    Rodada {proposal.negotiation_round}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div style={{ textAlign: 'right' }}>
                                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '4px' }}>
                                                                        {proposal.counter_price ? '🔄 Contraproposta' : '💰 Valor proposto'}
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: '1.8rem', fontWeight: 900, lineHeight: 1, color: priceColor,
                                                                        textShadow: `0 0 20px ${priceColor}50`
                                                                    }}>
                                                                        R$ {editorPrice.toFixed(0)}
                                                                    </div>
                                                                    {hasCustomPrice && priceDiff !== 0 && (
                                                                        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                                                seu budget: R$ {budget}
                                                                            </span>
                                                                            <span style={{
                                                                                fontSize: '0.72rem', fontWeight: 800,
                                                                                color: isAbove ? '#f87171' : '#4ade80',
                                                                                background: isAbove ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
                                                                                padding: '1px 6px', borderRadius: '6px'
                                                                            }}>
                                                                                {isAbove ? '+' : ''}{priceDiff.toFixed(0)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div style={{
                                                                padding: '14px 18px', borderRadius: '14px', fontSize: '0.92rem', lineHeight: 1.7,
                                                                color: 'var(--text-main)', fontStyle: 'italic',
                                                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                                                                position: 'relative'
                                                            }}>
                                                                <span style={{ position: 'absolute', top: '10px', left: '14px', fontSize: '1.8rem', opacity: 0.07, fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</span>
                                                                <span style={{ paddingLeft: '10px' }}>{proposal.cover_letter}</span>
                                                            </div>

                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                {proposal.status === 'accepted' ? (
                                                                    <div style={{
                                                                        flex: 1, padding: '12px', borderRadius: '14px',
                                                                        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                                        color: '#22c55e', fontWeight: 700, fontSize: '0.95rem'
                                                                    }}>
                                                                        <CheckCircle size={18} /> Editor Contratado
                                                                    </div>
                                                                ) : project.status === 'Aberto' ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => setSelectedEditor(proposal.editor)}
                                                                            style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                                        >
                                                                            <Users size={16} /> Ver Perfil
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleAcceptProposal(proposal, project.id)}
                                                                            disabled={acceptingProposalId === proposal.id}
                                                                            style={{
                                                                                flex: 2, padding: '13px 20px', borderRadius: '14px', border: 'none',
                                                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                                                color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                                                boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                                                                                opacity: acceptingProposalId === proposal.id ? 0.7 : 1,
                                                                                transition: 'all 0.2s'
                                                                            }}
                                                                        >
                                                                            {acceptingProposalId === proposal.id
                                                                                ? <><Loader2 size={16} className="animate-spin" /> Processando...</>
                                                                                : <><CheckCircle size={16} /> Aceitar e Contratar</>}
                                                                        </button>
                                                                    </>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {showCounterModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="glass" style={{ maxWidth: '400px', width: '100%', borderRadius: '24px', padding: '32px', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Nova Contraproposta</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Sugira um novo valor para este projeto.</p>
                        
                        <div style={{ position: 'relative', marginBottom: '24px' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--accent)' }}>R$</span>
                            <input 
                                type="number" 
                                value={counterPrice}
                                onChange={(e) => setCounterPrice(e.target.value)}
                                placeholder="Valor"
                                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', background: 'var(--input-bg)', border: '1px solid var(--accent)', color: 'white', fontSize: '1.2rem', fontWeight: 800, outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowCounterModal(null)} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'none', border: '1px solid var(--glass-border)', color: 'white' }}>Cancelar</button>
                            <button 
                                onClick={handleCounterOffer}
                                disabled={isSubmittingCounter || !counterPrice}
                                className="btn-primary" 
                                style={{ flex: 1, padding: '14px' }}
                            >
                                {isSubmittingCounter ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Enviar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReviewModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="glass" style={{ maxWidth: '500px', width: '100%', borderRadius: '24px', padding: '40px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#22c55e' }}>
                            <Star size={32} fill="#22c55e" />
                        </div>
                        <h3 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '8px' }}>Finalizar Projeto</h3>
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '32px' }}>Conte como foi trabalhar com este editor e libere o pagamento.</p>
                        
                        <div style={{ marginBottom: '32px' }}>
                            <textarea 
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="O editor foi atencioso? Cumpriu os prazos? A edição ficou como você queria?"
                                style={{ width: '100%', height: '120px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '16px', color: 'white', outline: 'none', resize: 'none', lineHeight: 1.6 }}
                            />
                        </div>

                        <button 
                            onClick={handleFinishProject}
                            disabled={isSubmittingReview || !reviewText.trim()}
                            className="btn-primary" 
                            style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#22c55e' }}
                        >
                            {isSubmittingReview ? <Loader2 className="animate-spin" /> : 'Confirmar e Liberar Pagamento'}
                        </button>
                        <button onClick={() => setShowReviewModal(null)} style={{ width: '100%', marginTop: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', padding: '8px' }}>Cancelar</button>
                    </div>
                </div>
            )}

            {previewFile && <VideoModal file={previewFile} status={previewFile.projectStatus} onClose={() => setPreviewFile(null)} />}

            {showEditModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
                    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass" style={{
                        maxWidth: '580px', width: '100%', borderRadius: '24px', padding: '36px',
                        border: '1px solid var(--glass-border)', background: 'var(--bg-deep)',
                        display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                    <Pencil size={18} color="var(--primary)" />
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Editar Projeto</h3>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{showEditModal.title}</p>
                            </div>
                            <button onClick={() => setShowEditModal(null)}
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Descrição / Briefing
                            </label>
                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Descreva o que espera do vídeo, estilo, roteiro, referências..."
                                style={{
                                    width: '100%', minHeight: '120px', padding: '14px 16px',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                                    borderRadius: '14px', color: 'var(--text-main)', outline: 'none',
                                    resize: 'vertical', fontSize: '0.95rem', lineHeight: 1.6,
                                    transition: 'border 0.2s'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Link Google Drive / Ryver
                            </label>
                            <input
                                type="url"
                                value={editRyverLink}
                                onChange={(e) => setEditRyverLink(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                style={{
                                    width: '100%', padding: '14px 16px', borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                                    color: 'var(--text-main)', outline: 'none', fontSize: '0.95rem'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Prazo Desejado
                            </label>
                            <input
                                type="date"
                                className="auth-input"
                                value={editDeadline ? new Date(editDeadline).toISOString().split('T')[0] : ''}
                                onChange={(e) => setEditDeadline(e.target.value)}
                                style={{
                                    width: '100%', padding: '14px 16px', borderRadius: '14px',
                                    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)',
                                    color: 'white', outline: 'none', fontSize: '0.95rem'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Arquivos do Projeto
                            </label>

                            <div
                                onClick={() => !isUploadingEdit && document.getElementById('edit-file-upload')?.click()}
                                style={{
                                    border: '2px dashed var(--glass-border)', borderRadius: '14px', padding: '20px',
                                    textAlign: 'center', cursor: isUploadingEdit ? 'wait' : 'pointer',
                                    background: 'rgba(99,102,241,0.03)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isUploadingEdit ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                                        <Loader2 size={18} className="animate-spin" /> Enviando arquivos...
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                                        <Upload size={18} color="var(--primary)" />
                                        <span>Clique para adicionar novos arquivos</span>
                                    </div>
                                )}
                                <input
                                    id="edit-file-upload"
                                    type="file"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={(e) => e.target.files && handleEditFileUpload(e.target.files)}
                                />
                            </div>

                            {editFiles.length > 0 && (
                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {editFiles.map((f: any, idx: number) => (
                                        <div key={idx} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '10px 14px', borderRadius: '10px',
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)'
                                        }}>
                                            <FileText size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
                                            <span style={{ flex: 1, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {f.name}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                                {f.size ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : ''}
                                            </span>
                                            <button
                                                onClick={() => setEditFiles(prev => prev.filter((_, i) => i !== idx))}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                                title="Remover arquivo"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                            <button
                                onClick={() => setShowEditModal(null)}
                                style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'none', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit}
                                className="btn-primary"
                                style={{ flex: 2, padding: '14px', borderRadius: '14px' }}
                            >
                                {isSavingEdit ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {selectedEditor && (
                <EditorPortfolioModal 
                    editor={selectedEditor} 
                    onClose={() => setSelectedEditor(null)} 
                />
            )}
        </div>
    );
};

export default MyProjectsPage;
