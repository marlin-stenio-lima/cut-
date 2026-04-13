import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import VideoModal from '../../components/dashboard/VideoModal';
import ProjectFilesModal from '../../components/dashboard/ProjectFilesModal';
import {
    Send,
    MessageSquare,
    Video,
    Loader2,
    Search,
    ChevronLeft,
    ExternalLink,
    Paperclip,
    ArrowRightLeft,
    CheckCircle2,
    FileText
} from 'lucide-react';

interface ProjectChat {
    id: string; // The UI key, can be project.id or proposal.id
    is_proposal: boolean;
    project_id?: string;
    proposal_id?: string;
    title: string;
    status: string;
    other_party_name?: string;
    video_type?: string; // Added for service type
    ryver_link?: string | null;
    project_files?: { name: string; url: string }[] | null;
    editor_id?: string | null;
}

interface Message {
    id: string;
    project_id?: string;
    proposal_id?: string;
    sender_id: string;
    content: string;
    created_at: string;
}

const ChatPage: React.FC = () => {
    const { user, profile } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<ProjectChat[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectChat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [negotiationHistory, setNegotiationHistory] = useState<any | null>(null);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null); // To track which proposal is being acted on
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false)
    const [previewFile, setPreviewFile] = useState<any | null>(null);
    const [showFilesModal, setShowFilesModal] = useState(false);
    const [showCounterModal, setShowCounterModal] = useState<any | null>(null);
    const [counterPrice, setCounterPrice] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    // Load projects and proposals where the user is involved
    useEffect(() => {
        const loadChats = async () => {
            if (!user || !profile) return;

            try {
                const isClient = profile.role === 'client';
                const formattedChats: ProjectChat[] = [];

                // 1. Fetch Active Projects
                const projectsQuery = supabase
                    .from('projects')
                    .select(`
id,
    title,
    status,
    client_id,
    editor_id,
    video_type,
    ryver_link,
    project_files,
    client: profiles!client_id(full_name),
        editor: profiles!editor_id(full_name)
            `)
                    .not('editor_id', 'is', null);

                if (isClient) {
                    projectsQuery.eq('client_id', user.id);
                } else {
                    projectsQuery.eq('editor_id', user.id);
                }

                const { data: projectsData, error: projError } = await projectsQuery.order('created_at', { ascending: false });
                if (projError) throw projError;

                if (projectsData) {
                    projectsData.forEach((p: any) => {
                        formattedChats.push({
                            id: p.id,
                            is_proposal: false,
                            project_id: p.id,
                            title: p.title,
                            status: p.status,
                            other_party_name: isClient ? p.editor?.full_name : p.client?.full_name,
                            video_type: p.video_type,
                            ryver_link: p.ryver_link,
                            project_files: p.project_files,
                            editor_id: p.editor_id
                        });
                    });
                }

                // 2. Fetch Pending Proposals
                let proposalsQuery = supabase
                    .from('proposals')
                    .select(`
    id,
    project_id,
    status,
    editor_id,
    editor: profiles!editor_id(full_name),
    project: projects!project_id(title, video_type, client: profiles!client_id(full_name), ryver_link, project_files, editor_id)
                    `)
                    .eq('status', 'pending');

                if (isClient) {
                    // For client, we first need their projects
                    const { data: clientUserProjects } = await supabase.from('projects').select('id').eq('client_id', user.id);
                    const projectIds = clientUserProjects?.map(p => p.id) || [];
                    if (projectIds.length > 0) {
                        const { data: proposalsData } = await proposalsQuery.in('project_id', projectIds);
                        proposalsData?.forEach((p: any) => {
                            formattedChats.push({
                                id: p.id,
                                is_proposal: true,
                                proposal_id: p.id,
                                project_id: p.project_id,
                                title: `Negociação: ${p.project?.title || 'Projeto'}`,
                                status: 'Pendente',
                                other_party_name: p.project?.client?.full_name,
                                video_type: p.project?.video_type,
                                ryver_link: p.project?.ryver_link,
                                project_files: p.project?.project_files,
                                editor_id: p.editor_id || p.project?.editor_id
                            });
                        });
                    }
                } else {
                    proposalsQuery = proposalsQuery.eq('editor_id', user.id);
                    const { data: myProposals } = await proposalsQuery;
                    myProposals?.forEach((p: any) => {
                        formattedChats.push({
                            id: p.id,
                            is_proposal: true,
                            proposal_id: p.id,
                            project_id: p.project_id,
                            title: `Proposta: ${p.project?.title || 'Projeto'} `,
                            status: 'Pendente',
                            other_party_name: p.project?.client?.full_name,
                            video_type: p.project?.video_type,
                            ryver_link: p.project?.ryver_link,
                            project_files: p.project?.project_files,
                            editor_id: p.editor_id || p.project?.editor_id
                        });
                    });
                }

                setProjects(formattedChats);

                // If there's only one project, select it by default
                if (formattedChats.length === 1) {
                    setSelectedProject(formattedChats[0]);
                }
            } catch (err) {
                console.error('Error loading chats:', err);
            } finally {
                setLoading(false);
            }
        };

        loadChats();
    }, [user, profile]);

    // Fetch negotiation history for a project
    const fetchNegotiationHistory = async (projectId: string, proposalId?: string) => {
        try {
            const query = supabase
                .from('proposals')
                .select('*, editor:profiles!editor_id(full_name), project:projects!project_id(title, budget, client:profiles!client_id(full_name))')
                .eq('project_id', projectId)
                .order('created_at', { ascending: true });

            if (proposalId) query.eq('id', proposalId);

            const { data } = await query;
            setNegotiationHistory(data || []);
        } catch (err) {
            console.error('Error fetching negotiation history:', err);
        }
    };

    // Subscription and message loading
    useEffect(() => {
        if (!selectedProject) return;

        setNegotiationHistory(null);
        if (selectedProject.project_id) {
            fetchNegotiationHistory(selectedProject.project_id, selectedProject.is_proposal ? selectedProject.proposal_id : undefined);
        }

        const fetchMessages = async () => {
            const query = supabase.from('messages').select('*').order('created_at', { ascending: true });

            if (selectedProject.is_proposal) {
                query.eq('proposal_id', selectedProject.proposal_id);
            } else {
                query.eq('project_id', selectedProject.project_id).is('proposal_id', null);
            }

            const { data, error } = await query;
            if (error) console.error('Error fetching messages:', error);
            else setMessages(data || []);
        };

        fetchMessages();

        const channel = supabase
            .channel(`chat-room-${selectedProject.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMsg = payload.new as Message;
                if (selectedProject.is_proposal) {
                    if (newMsg.proposal_id === selectedProject.proposal_id) {
                        setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
                    }
                } else {
                    if (newMsg.project_id === selectedProject.project_id && !newMsg.proposal_id) {
                        setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
                    }
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedProject]);

    useEffect(() => {
        if (selectedProject) {
            // Setup a global function so the modal can trigger the video preview
            (window as any).openVideoPreview = (file: any) => {
                setPreviewFile(file);
            };
        }
        return () => {
            delete (window as any).openVideoPreview;
        };
    }, [selectedProject]);

    const refreshProjectData = async () => {
        if (!selectedProject || !user) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', selectedProject.project_id || selectedProject.id)
                .single();

            if (fetchError) throw fetchError;

            if (data) {
                // Update selected project in state
                setSelectedProject(prev => prev ? {
                    ...prev,
                    project_files: data.project_files,
                    ryver_link: data.ryver_link
                } : null);

                // Update in projects list too
                setProjects(prev => prev.map(p =>
                    p.id === selectedProject.id ? {
                        ...p,
                        project_files: data.project_files,
                        ryver_link: data.ryver_link
                    } : p
                ));
            }
        } catch (err) {
            console.error('Error refreshing project data:', err);
        }
    };

    // Client: Accept and Contract (Escrow Lock)
    const handleAcceptProposalFromChat = async (prop: any) => {
        if (!user || !profile || isActionLoading) return;

        const finalPrice = Number(prop.counter_price || prop.offered_price || prop.project?.budget || 0);

        const confirmed = await showConfirm(
            'Confirmar Contratação',
            `Confirmar contratação por R$ ${finalPrice}? O valor será reservado do seu saldo.`
        );
        if (!confirmed) return;

        setIsActionLoading(prop.id);
        try {
            // 1. Get latest balance
            const { data: latestProfile, error: profErr } = await supabase
                .from('profiles')
                .select('balance, frozen_balance')
                .eq('id', user.id)
                .single();
            if (profErr) throw profErr;

            if (Number(latestProfile.balance) < finalPrice) {
                const missing = finalPrice - Number(latestProfile.balance);
                const goToRecharge = await showConfirm(
                    'Saldo Insuficiente',
                    `Você tem R$ ${latestProfile.balance}, mas o projeto custa R$ ${finalPrice}. Deseja recarregar R$ ${missing} para continuar?`
                );
                if (goToRecharge) {
                    navigate(`/dashboard?deposit=true&amount=${missing}`);
                }
                return;
            }

            // 2. Lock Balance
            const { error: balanceErr } = await supabase
                .from('profiles')
                .update({
                    balance: Number(latestProfile.balance) - finalPrice,
                    frozen_balance: Number(latestProfile.frozen_balance || 0) + finalPrice
                })
                .eq('id', user.id);
            if (balanceErr) throw balanceErr;

            // 3. Update Proposal
            const { error: propErr } = await supabase
                .from('proposals')
                .update({ status: 'accepted' })
                .eq('id', prop.id);
            if (propErr) throw propErr;

            // 4. Update Project
            const { error: projErr } = await supabase
                .from('projects')
                .update({
                    status: 'Em Edição',
                    editor_id: prop.editor_id,
                    final_price: finalPrice
                })
                .eq('id', prop.project_id);
            if (projErr) throw projErr;

            // 5. Log Transaction
            await supabase.from('wallet_transactions').insert({
                user_id: user.id,
                amount: finalPrice,
                type: 'ESCROW_LOCK',
                status: 'SUCCESS',
                description: `Contratação via Chat: ${prop.project?.title}`
            });

            showAlert('Sucesso!', 'Contrato firmado! Saldo reservado e projeto iniciado.', 'success');

            // Refresh
            fetchNegotiationHistory(prop.project_id);
            if (selectedProject) {
                setSelectedProject({ ...selectedProject, status: 'Em Edição' });
            }
        } catch (err: any) {
            console.error('Error accepting in chat:', err);
            showAlert('Erro', `Erro: ${err.message}`, 'error');
        } finally {
            setIsActionLoading(null);
        }
    };

    // Editor: Accept Client's Price
    const handleEditorAcceptValue = async (prop: any) => {
        if (!user || isActionLoading) return;

        const price = Number(prop.counter_price);
        const confirmed = await showConfirm(
            'Aceitar Valor',
            `Aceitar fazer este projeto por R$ ${price}?`
        );
        if (!confirmed) return;

        setIsActionLoading(prop.id);
        try {
            const { error } = await supabase
                .from('proposals')
                .update({
                    offered_price: price,
                    counter_price: null,
                    last_sender_id: user.id
                })
                .eq('id', prop.id);

            if (error) throw error;
            showAlert('Sucesso!', 'Você aceitou o valor! O cliente agora pode finalizar o pagamento.', 'success');
            fetchNegotiationHistory(prop.project_id);
        } catch (err: any) {
            alert(`Erro: ${err.message}`);
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleSendCounterOfferFromChat = async () => {
        if (!showCounterModal || !counterPrice || !user) return;

        setIsActionLoading(showCounterModal.id);
        try {
            const nextRound = (showCounterModal.negotiation_round || 1) + 1;

            const { error } = await supabase
                .from('proposals')
                .update({
                    counter_price: Number(counterPrice),
                    negotiation_round: nextRound,
                    last_sender_id: user.id,
                    status: 'pending'
                })
                .eq('id', showCounterModal.id);

            if (error) throw error;

            showAlert('Sucesso!', 'Contraproposta enviada com sucesso.', 'success');
            setShowCounterModal(null);
            setCounterPrice('');
            fetchNegotiationHistory(showCounterModal.project_id);
        } catch (err: any) {
            console.error('Error sending counter-offer:', err);
            showAlert('Erro', `Falha ao enviar: ${err.message}`, 'error');
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedProject || !newMessage.trim() || sending) return;

        // Restriction: Editor can only send if proposal is accepted or it's a regular project chat
        // REMOVED at user request to allow negotiation in chat
        /*
        if (profile?.role === 'editor' && selectedProject.is_proposal && selectedProject.status === 'Pendente') {
            alert('Você só poderá enviar mensagens após o cliente aceitar sua proposta.');
            return;
        }
        */

        const content = newMessage.trim();
        const tempId = `temp - ${Date.now()} `;

        // Optimistic UI Update
        const optimisticMessage: Message = {
            id: tempId,
            sender_id: user.id,
            content,
            created_at: new Date().toISOString(),
            project_id: selectedProject.project_id,
            proposal_id: selectedProject.proposal_id
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        setSending(true);

        try {
            const insertData: any = {
                sender_id: user.id,
                content
            };

            if (selectedProject.is_proposal) {
                insertData.proposal_id = selectedProject.proposal_id;
                insertData.project_id = selectedProject.project_id;
            } else {
                insertData.project_id = selectedProject.project_id;
            }

            const { data, error } = await supabase
                .from('messages')
                .insert(insertData)
                .select()
                .single();

            if (error) throw error;

            // Replace temporary message with real one from DB
            if (data) {
                setMessages(prev => prev.map(m => m.id === tempId ? data : m));
            }
        } catch (err: any) {
            console.error('Error sending message:', err);
            // Remove the optimistic message if it failed
            setMessages(prev => prev.filter(m => m.id !== tempId));
            alert('Erro ao enviar mensagem. Tente novamente.');
        } finally {
            setSending(false);
            setTimeout(scrollToBottom, 100);
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
            borderRadius: '0',
            overflow: 'hidden',
            border: 'none',
            animation: 'fadeIn 0.3s ease-out',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)'
        }}>
            {/* Sidebar: Projects List */}
            <div style={{
                width: '320px',
                display: (selectedProject && window.innerWidth < 768) ? 'none' : 'flex',
                flexDirection: 'column',
                borderRight: '1px solid var(--glass-border)',
                background: 'rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
                        <MessageSquare size={20} color="var(--accent)" /> Mensagens
                    </h3>
                </div>

                <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar projeto..."
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 36px',
                                background: 'rgba(0, 0, 0, 0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '10px',
                                color: 'var(--text-main)',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }} />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {projects.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <p>Nenhum projeto ativo para chat.</p>
                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Aceite uma proposta para começar a conversar!</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {projects.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedProject(p)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: selectedProject?.id === p.id ? 'rgba(7, 182, 213, 0.1)' : 'transparent',
                                        border: 'none',
                                        borderRadius: '16px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}
                                    className="chat-item-hover"
                                >
                                    {/* Avatar with Initials */}
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: selectedProject?.id === p.id ? 'var(--accent)' : 'rgba(0, 0, 0, 0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        color: selectedProject?.id === p.id ? '#000' : 'var(--text-main)',
                                        border: selectedProject?.id === p.id ? 'none' : '1px solid var(--glass-border)',
                                        transition: 'all 0.3s'
                                    }}>
                                        {(p.other_party_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.other_party_name || 'Participante'}
                                        </div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)',
                                            marginTop: '2px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            textTransform: 'capitalize'
                                        }}>
                                            <Video size={12} style={{ opacity: 0.6 }} /> {p.video_type || 'Vídeo'}
                                        </div>
                                    </div>
                                    {selectedProject?.id === p.id && (
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }}></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0, 0, 0, 0.02)' }}>
                {selectedProject ? (
                    <>
                        {/* Header */}
                        <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <button
                                    onClick={() => setSelectedProject(null)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: (window.innerWidth < 768 ? 'block' : 'none') }}
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                {/* Avatar in Header */}
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    background: 'var(--accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    color: '#000'
                                }}>
                                    {(selectedProject.other_party_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '2px' }}>
                                        {selectedProject.other_party_name || 'Participante'}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}>
                                            <Video size={12} style={{ opacity: 0.6 }} /> {selectedProject.video_type || 'Vídeo'}
                                            <span style={{ opacity: 0.4 }}>•</span>
                                            <span style={{ fontWeight: 500 }}>{selectedProject.title}</span>
                                        </div>
                                        {selectedProject.ryver_link && (
                                            <a href={selectedProject.ryver_link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none', background: 'rgba(7, 182, 213, 0.1)', padding: '1px 8px', borderRadius: '4px' }}>
                                                <ExternalLink size={10} /> Ryver
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowFilesModal(true)}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                                }}
                            >
                                <Paperclip size={16} /> Ver Arquivos
                            </button>
                        </div>

                        {/* Project Files Bar (Removed as it's now in Modal) */}

                        {/* Messages Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            {/* ── Negotiation History Timeline ── */}
                            {negotiationHistory && negotiationHistory.length > 0 && (
                                <div style={{ marginBottom: '8px' }}>
                                    {/* Section header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                                            📋 Histórico de Negociação
                                        </span>
                                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                    </div>

                                    {negotiationHistory.map((prop: any) => {
                                        const budget = Number(prop.project?.budget || 0);
                                        const offered = prop.offered_price ? Number(prop.offered_price) : null;
                                        const counter = prop.counter_price ? Number(prop.counter_price) : null;
                                        const isAccepted = prop.status === 'accepted';

                                        return (
                                            <div key={prop.id} style={{
                                                borderRadius: '18px', overflow: 'hidden', marginBottom: '12px',
                                                border: `1px solid ${isAccepted ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.15)'}`,
                                                background: isAccepted
                                                    ? 'linear-gradient(135deg, rgba(34,197,94,0.04), rgba(0,0,0,0.2))'
                                                    : 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(0,0,0,0.2))'
                                            }}>
                                                {/* Accent bar */}
                                                <div style={{ height: '2px', background: isAccepted ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />

                                                <div style={{ padding: '16px 20px' }}>
                                                    {/* Row 1: Editor + Status */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{
                                                                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                                                                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: 800, fontSize: '0.9rem', color: 'white'
                                                            }}>{(prop.editor?.full_name || 'E')[0].toUpperCase()}</div>
                                                            <div>
                                                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{prop.editor?.full_name || 'Editor'}</div>
                                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                                    {new Date(prop.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span style={{
                                                            fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '100px',
                                                            background: isAccepted ? 'rgba(34,197,94,0.12)' : 'rgba(251,191,36,0.1)',
                                                            color: isAccepted ? '#22c55e' : '#fbbf24',
                                                            display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}>
                                                            {isAccepted ? <><CheckCircle2 size={11} /> Aceita</> : '⏳ Pendente'}
                                                        </span>
                                                    </div>

                                                    {/* Row 2: Price timeline */}
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                                                        padding: '12px 16px', borderRadius: '12px',
                                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                                                        marginBottom: '12px'
                                                    }}>
                                                        {/* Client budget */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Budget</span>
                                                            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-muted)' }}>R$ {budget}</span>
                                                        </div>

                                                        {offered && (
                                                            <>
                                                                <ArrowRightLeft size={14} color="rgba(255,255,255,0.2)" />
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                                    <span style={{ fontSize: '0.6rem', color: '#6366f1', textTransform: 'uppercase', fontWeight: 700 }}>Editor pediu</span>
                                                                    <span style={{ fontWeight: 800, fontSize: '1rem', color: offered > budget ? '#fbbf24' : '#4ade80' }}>R$ {offered}</span>
                                                                </div>
                                                            </>
                                                        )}

                                                        {counter && (
                                                            <>
                                                                <ArrowRightLeft size={14} color="rgba(255,255,255,0.2)" />
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                                    <span style={{ fontSize: '0.6rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>Cliente contra</span>
                                                                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#38bdf8' }}>R$ {counter}</span>
                                                                </div>
                                                            </>
                                                        )}

                                                        {isAccepted && (
                                                            <>
                                                                <ArrowRightLeft size={14} color="rgba(255,255,255,0.2)" />
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                                    <span style={{ fontSize: '0.6rem', color: '#22c55e', textTransform: 'uppercase', fontWeight: 700 }}>Fechado</span>
                                                                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#22c55e' }}>R$ {counter || offered || budget}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Cover letter */}
                                                    {prop.cover_letter && (
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic', display: 'flex', gap: '8px' }}>
                                                            <FileText size={13} style={{ flexShrink: 0, marginTop: '3px', opacity: 0.5 }} />
                                                            <span>{prop.cover_letter}</span>
                                                        </div>
                                                    )}
                                                    {/* Action Buttons for Negotiation */}
                                                    {!isAccepted && selectedProject?.status === 'Aberto' && (
                                                        <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                                                            {/* Client UI: Accept Editor's Proposal */}
                                                            {profile?.role === 'client' && prop.last_sender_id === prop.editor_id && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleAcceptProposalFromChat(prop)}
                                                                        disabled={!!isActionLoading}
                                                                        style={{
                                                                            flex: 2, padding: '10px', borderRadius: '12px', border: 'none',
                                                                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                                                            color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                                            boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
                                                                        }}
                                                                    >
                                                                        {isActionLoading === prop.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                                        Aceitar e Contratar (R$ {offered})
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setShowCounterModal(prop);
                                                                            setCounterPrice('');
                                                                        }}
                                                                        disabled={!!isActionLoading}
                                                                        style={{
                                                                            flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                                                                            background: 'rgba(255,255,255,0.05)',
                                                                            color: 'white', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                                                                        }}
                                                                    >
                                                                        Contraproposta
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* Client UI: Wait for Editor to respond to client's counter */}
                                                            {profile?.role === 'client' && prop.last_sender_id === user?.id && (
                                                                <div style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                                                                    Aguardando resposta do editor...
                                                                </div>
                                                            )}

                                                            {/* Editor UI: Accept Client's Counter-proposal */}
                                                            {profile?.role === 'editor' && prop.last_sender_id !== user?.id && counter && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleEditorAcceptValue(prop)}
                                                                        disabled={!!isActionLoading}
                                                                        style={{
                                                                            flex: 2, padding: '10px', borderRadius: '12px', border: 'none',
                                                                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                                                            color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                                            boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                                                                        }}
                                                                    >
                                                                        {isActionLoading === prop.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                                        Aceitar R$ {counter}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setShowCounterModal(prop);
                                                                            setCounterPrice('');
                                                                        }}
                                                                        disabled={!!isActionLoading}
                                                                        style={{
                                                                            flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                                                                            background: 'rgba(255,255,255,0.05)',
                                                                            color: 'white', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                                                                        }}
                                                                    >
                                                                        Contraproposta
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* Editor UI: Wait for Client if Editor was last to propose */}
                                                            {profile?.role === 'editor' && prop.last_sender_id === user?.id && (
                                                                <div style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                                                                    Aguardando aceite do cliente...
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Divider before messages */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', marginBottom: '8px' }}>
                                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                                            💬 Conversa
                                        </span>
                                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                    </div>
                                </div>
                            )}

                            {/* Regular messages */}
                            {messages.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px', padding: '32px 0', opacity: 0.7 }}>
                                    <MessageSquare size={28} style={{ opacity: 0.3 }} />
                                    <p style={{ fontSize: '0.85rem' }}>Nenhuma mensagem ainda. Inicie a conversa!</p>
                                </div>
                            ) : (
                                messages.map((m) => {
                                    const isMe = m.sender_id === user?.id;
                                    return (
                                        <div key={m.id} style={{
                                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                                            maxWidth: '70%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '6px'
                                        }}>
                                            <div style={{
                                                padding: '12px 20px',
                                                borderRadius: isMe ? '20px 20px 0 20px' : '20px 20px 20px 0',
                                                background: isMe ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                                                color: isMe ? '#000' : 'var(--text-main)',
                                                fontSize: '0.95rem',
                                                lineHeight: 1.5,
                                                boxShadow: isMe ? '0 8px 20px rgba(7, 182, 213, 0.15)' : 'none',
                                                fontWeight: isMe ? 500 : 400,
                                                border: isMe ? 'none' : '1px solid var(--glass-border)'
                                            }}>
                                                {m.content}
                                            </div>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: isMe ? 'right' : 'left', padding: '0 4px' }}>
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Footer Input */}
                        <div style={{ padding: '24px 32px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0, 0, 0, 0.02)' }}>
                            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    style={{
                                        flex: 1,
                                        padding: '14px 20px',
                                        background: 'rgba(0, 0, 0, 0.03)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '14px',
                                        color: 'var(--text-main)',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        fontSize: '0.95rem'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'rgba(7, 182, 213, 0.4)';
                                        e.target.style.background = 'rgba(255,255,255,0.05)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                                        e.target.style.background = 'rgba(255,255,255,0.03)';
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    style={{
                                        padding: '0 24px',
                                        background: 'var(--accent)',
                                        border: 'none',
                                        borderRadius: '14px',
                                        color: '#000',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        opacity: (!newMessage.trim() || sending) ? 0.5 : 1,
                                        fontWeight: 600,
                                        boxShadow: '0 4px 15px rgba(7, 182, 213, 0.3)'
                                    }}
                                >
                                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', gap: '24px', padding: '40px', textAlign: 'center' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '40px',
                            background: 'rgba(0, 0, 0, 0.02)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--glass-border)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                        }}>
                            <MessageSquare size={48} color="var(--accent)" style={{ opacity: 0.5 }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px', background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Central de Mensagens
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', lineHeight: 1.6 }}>
                                Selecione uma conversa ao lado para visualizar o histórico e enviar novas mensagens para seus colaboradores.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {previewFile && <VideoModal file={previewFile} onClose={() => setPreviewFile(null)} />}

            {
                showFilesModal && selectedProject && (
                    <ProjectFilesModal
                        project={{
                            id: selectedProject.project_id || selectedProject.id,
                            title: selectedProject.title,
                            project_files: selectedProject.project_files,
                            ryver_link: selectedProject.ryver_link,
                            editor_id: selectedProject.editor_id,
                            is_proposal: selectedProject.is_proposal
                        }}
                        userRole={profile?.role as any}
                        userId={user?.id || ''}
                        onClose={() => setShowFilesModal(false)}
                        onRefresh={refreshProjectData}
                        onPreviewVideo={(file) => {
                            setPreviewFile(file);
                            setShowFilesModal(false);
                        }}
                    />
                )
            }

            {showCounterModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="glass" style={{ maxWidth: '400px', width: '100%', borderRadius: '24px', padding: '32px', border: '1px solid var(--glass-border)', background: 'var(--bg-deep)' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', fontWeight: 800 }}>Nova Contraproposta</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>Sugira um novo valor para este projeto. O outro participante será notificado.</p>

                        <div style={{ position: 'relative', marginBottom: '24px' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--accent)' }}>R$</span>
                            <input
                                type="number"
                                value={counterPrice}
                                onChange={(e) => setCounterPrice(e.target.value)}
                                placeholder="Valor"
                                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--accent)', color: 'white', fontSize: '1.2rem', fontWeight: 800, outline: 'none' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowCounterModal(null)} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'none', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                            <button
                                onClick={handleSendCounterOfferFromChat}
                                disabled={!!isActionLoading || !counterPrice}
                                style={{
                                    flex: 1, padding: '14px', borderRadius: '14px', border: 'none',
                                    background: 'linear-gradient(135deg, #07b6d5, #6366f1)',
                                    color: 'white', fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    opacity: (!counterPrice || isActionLoading) ? 0.5 : 1
                                }}
                            >
                                {isActionLoading === showCounterModal.id ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Enviar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
            .chat-item-hover:hover {
                background: rgba(0, 0, 0, 0.05) !important;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(7, 182, 213, 0.4); }
                70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 10px rgba(7, 182, 213, 0); }
                100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(7, 182, 213, 0); }
            }
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.1); }
        `}</style>
        </div>
    );
};

export default ChatPage;
