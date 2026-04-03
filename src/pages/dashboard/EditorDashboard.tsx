import React, { useState, useEffect } from 'react'
import { Zap, Target, Loader2, Clock, X, Send, CreditCard } from 'lucide-react'
import { asaasService } from '../../services/asaas'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'

const EditorDashboard: React.FC = () => {
    const { user } = useAuth()
    const [isOnline, setIsOnline] = useState(true)
    const [marketplaceProjects, setMarketplaceProjects] = useState<any[]>([])
    const [appliedProjectIds, setAppliedProjectIds] = useState<Set<string>>(new Set())
    const [myActiveProjects, setMyActiveProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Proposal Modal State
    const [selectedProject, setSelectedProject] = useState<any | null>(null)
    const [coverLetter, setCoverLetter] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Wallet State
    const [showWalletModal, setShowWalletModal] = useState(false)
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [pixKey, setPixKey] = useState('')
    const [pixType, setPixType] = useState('CPF')
    const [isWithdrawing, setIsWithdrawing] = useState(false)
    const [transactions, setTransactions] = useState<any[]>([])
    const [balance, setBalance] = useState(0)

    useEffect(() => {
        const loadEditorData = async () => {
            if (!user) return
            try {
                // 1. Fetch available projects (Marketplace)
                const { data: marketplaceData, error: mError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('status', 'Aberto')
                    .is('editor_id', null)
                    .order('created_at', { ascending: false })
                    .limit(4)

                if (mError) throw mError
                setMarketplaceProjects(marketplaceData || [])

                // 2. Fetch my proposals
                const { data: proposalsData, error: proposalsError } = await supabase
                    .from('proposals')
                    .select('project_id')
                    .eq('editor_id', user.id);

                if (proposalsError) throw proposalsError;
                const appliedIds = new Set(proposalsData?.map(p => p.project_id) || []);
                setAppliedProjectIds(appliedIds);

                // 3. Fetch my active projects
                const { data: activeData, error: aError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('editor_id', user.id)
                    .order('created_at', { ascending: false })

                if (aError) throw aError
                setMyActiveProjects(activeData || [])

                // 4. Fetch Wallet Data
                const { data: profData } = await supabase.from('profiles').select('balance').eq('id', user.id).single()
                setBalance(Number(profData?.balance || 0))

                const txs = await asaasService.getTransactions()
                setTransactions(txs || [])
            } catch (err: any) {
                console.error('Error loading editor dashboard:', err)
            } finally {
                setLoading(false)
            }
        }
        loadEditorData()
    }, [user])

    const openProposalModal = (project: any) => {
        setSelectedProject(project)
        setCoverLetter('')
    }

    const closeProposalModal = () => {
        setSelectedProject(null)
        setCoverLetter('')
    }

    const submitProposal = async () => {
        if (!user || !selectedProject || !coverLetter.trim()) return

        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('proposals')
                .insert({
                    project_id: selectedProject.id,
                    editor_id: user.id,
                    cover_letter: coverLetter.trim()
                })

            if (error) {
                if (error.code === '23505') {
                    alert('Você já enviou uma proposta para este projeto.')
                } else {
                    throw error
                }
            } else {
                setAppliedProjectIds(prev => new Set(prev).add(selectedProject.id))
                alert('Proposta enviada com sucesso!')
                closeProposalModal()
            }
        } catch (error: any) {
            console.error('Error submitting proposal:', error)
            alert(`Erro ao enviar proposta: ${error.message}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Calculate metrics based on active/finished projects later when implemented, using placeholders for now
    const handleWithdraw = async () => {
        if (!user || !withdrawAmount || !pixKey) return
        const amount = parseFloat(withdrawAmount)
        if (amount > balance) {
            alert('Saldo insuficiente!')
            return
        }

        setIsWithdrawing(true)
        try {
            const { error } = await supabase
                .from('wallet_transactions')
                .insert({
                    user_id: user.id,
                    amount: amount,
                    type: 'WITHDRAWAL',
                    status: 'AWAITING_APPROVAL',
                    description: `Resgate via PIX (${pixType})`,
                    metadata: {
                        pixKey,
                        pixKeyType: pixType
                    }
                })

            if (error) throw error

            alert('Solicitação enviada! Aguarde a aprovação do administrador.')
            setShowWalletModal(false)
            setWithdrawAmount('')
            
            // Refresh balance and txs
            const { data: profData } = await supabase.from('profiles').select('balance').eq('id', user.id).single()
            setBalance(Number(profData?.balance || 0))
            const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
            setTransactions(txs || [])
        } catch (err: any) {
            alert(`Erro ao solicitar saque: ${err.message}`)
        } finally {
            setIsWithdrawing(false)
        }
    }


    const formattedEarnings = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(balance)

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 className="animate-spin" size={32} color="var(--accent)" />
            </div>
        )
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
            <header className="flex-responsive-row" style={{
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '32px 40px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0, 0, 0, 0.2)',
                flexShrink: 0
            }}>
                <div>
                    <h1 className="dashboard-header-title" style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px', background: 'linear-gradient(to right, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Olá, Editor! 🎨</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Prepare suas ferramentas, grandes projetos esperam por você.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '10px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: isOnline ? '#22c55e' : 'var(--text-muted)' }}>
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

            <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                <div className="flex-responsive-row" style={{ gap: '32px', height: '100%' }}>
                    {/* Main Content Area */}
                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Marketplace Preview */}
                        <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
                                    <Zap size={20} className="accent-cyan" /> Projetos em Destaque
                                </h2>
                                <button
                                    onClick={() => window.location.href = '/dashboard/explore'}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    Explorar todos
                                </button>
                            </div>

                            <div className="grid-responsive-2" style={{ gap: '20px' }}>
                                {marketplaceProjects.length === 0 ? (
                                    <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        Nenhum projeto disponível no momento. Volte mais tarde!
                                    </div>
                                ) : (
                                    marketplaceProjects.map((job) => {
                                        const hasApplied = appliedProjectIds.has(job.id);

                                        return (
                                            <div key={job.id} style={{
                                                padding: '20px',
                                                borderRadius: '16px',
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--glass-border)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '16px'
                                            }}>
                                                <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-main)' }}>{job.title}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
                                                        R$ {job.budget || '0'}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#fbbf24' }}>
                                                        Prazo: {job.deadline ? new Date(job.deadline).toLocaleDateString('pt-BR') : 'A Combinar'}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <span style={{ fontSize: '0.7rem', textTransform: 'capitalize', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                                        {job.video_type}
                                                    </span>
                                                    <span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                                        {job.format}
                                                    </span>
                                                </div>
                                                {hasApplied ? (
                                                    <button
                                                        style={{ width: '100%', padding: '12px', borderRadius: '100px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-main)', border: 'none', fontWeight: 600, cursor: 'default' }}
                                                        disabled
                                                    >
                                                        Já Candidatado
                                                    </button>
                                                ) : (
                                                    <button
                                                        style={{ width: '100%', padding: '12px', borderRadius: '100px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                                                        onClick={() => openProposalModal(job)}
                                                    >
                                                        Candidatar-se
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Active Work */}
                        <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', color: 'var(--text-main)' }}>Meus Projetos Ativos</h2>

                            {myActiveProjects.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                                    <p style={{ color: 'var(--text-muted)' }}>Você não tem projetos ativos no momento. Explore o marketplace para começar!</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {myActiveProjects.map((project) => (
                                        <div key={project.id} className="grid-responsive-4 list-responsive" style={{
                                            alignItems: 'center',
                                            padding: '16px',
                                            borderRadius: '16px',
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--glass-border)'
                                        }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{project.title}</div>
                                            <div>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '100px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                        background: project.status === 'Em Edição' ? 'rgba(99, 102, 241, 0.1)' :
                                                                   project.status === 'Revisão' ? 'rgba(251, 191, 36, 0.1)' :
                                                                   project.status === 'Aguardando Pagamento' ? 'rgba(34, 197, 94, 0.1)' :
                                                                   'rgba(255, 255, 255, 0.05)',
                                                        color: project.status === 'Em Edição' ? 'var(--primary)' :
                                                               project.status === 'Revisão' ? '#fbbf24' :
                                                               project.status === 'Aguardando Pagamento' ? '#4ade80' :
                                                               'var(--text-muted)'
                                                    }}>
                                                        {project.status === 'Aguardando Pagamento' ? 'Entregue' : project.status}
                                                    </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <Clock size={16} /> {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : '-'}
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
                            )}
                        </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CreditCard size={18} color="var(--primary)" /> Carteira
                            </h3>
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Saldo Disponível</p>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{formattedEarnings}</h2>
                            </div>
                            <button 
                                onClick={() => setShowWalletModal(true)}
                                className="glow-btn"
                                style={{ width: '100%', padding: '12px', borderRadius: '100px', fontSize: '0.9rem' }}
                                disabled={balance <= 0}
                            >
                                Solicitar Saque
                            </button>
                        </div>

                        <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-main)' }}>Minhas Métricas</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    { label: 'Projetos Concluídos', value: myActiveProjects.filter(p => p.status === 'Concluído').length.toString(), icon: <Target size={16} className="accent-cyan" /> },
                                ].map((m, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            {m.icon} {m.label}
                                        </div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{m.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-main)' }}>Extrato Recente</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {transactions.slice(0, 4).map((tx, idx) => (
                                    <div key={idx} style={{ padding: '8px 0', borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.03)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{tx.type === 'TOPUP' ? 'Crédito' : 'Saque'}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: tx.type === 'deposit' || tx.type === 'TOPUP' || tx.type === 'PAYMENT' ? '#4ade80' : '#ef4444' }}>
                                            {tx.type === 'deposit' || tx.type === 'TOPUP' || tx.type === 'PAYMENT' ? '+' : '-'} R$ {tx.amount}
                                        </div>
                                    </div>
                                ))}
                                {transactions.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Sem transações.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Proposal Modal */}
                {selectedProject && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}>
                        <div className="glass" style={{
                            maxWidth: '600px', width: '100%', borderRadius: '24px', padding: '32px',
                            display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-deep)'
                        }}>
                            <button
                                onClick={closeProposalModal}
                                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--text-main)' }}>Enviar Proposta</h2>
                                <p style={{ color: 'var(--text-muted)' }}>Você está se candidatando para: <strong style={{ color: 'var(--text-main)' }}>{selectedProject.title}</strong></p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Carta de Apresentação</label>
                                <textarea
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Descreva por que você é ideal para este projeto..."
                                    rows={6}
                                    style={{
                                        width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.4)',
                                        border: '1px solid var(--glass-border)', color: 'white', outline: 'none',
                                        resize: 'vertical', fontFamily: 'inherit'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                <button
                                    onClick={closeProposalModal}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '12px 24px', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={submitProposal}
                                    disabled={isSubmitting || !coverLetter.trim()}
                                    className="btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: (isSubmitting || !coverLetter.trim()) ? 0.5 : 1 }}
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    Enviar Proposta
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

                {/* Withdrawal Modal */}
                {showWalletModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}>
                        <div className="glass" style={{
                            maxWidth: '450px', width: '100%', borderRadius: '24px', padding: '32px',
                            display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-deep)'
                        }}>
                            <button
                                onClick={() => setShowWalletModal(false)}
                                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--text-main)' }}>Solicitar Saque</h2>
                                <p style={{ color: 'var(--text-muted)' }}>O valor será enviado via PIX para sua conta.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Saldo Disponível</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80' }}>{formattedEarnings}</div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Valor do Saque</label>
                                    <input 
                                        type="number" 
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="R$ 0,00"
                                        min="1"
                                        max={balance}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tipo de Chave PIX</label>
                                    <select 
                                        value={pixType}
                                        onChange={(e) => setPixType(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none' }}
                                    >
                                        <option value="CPF">CPF</option>
                                        <option value="CNPJ">CNPJ</option>
                                        <option value="CELULAR">Celular</option>
                                        <option value="EMAIL">E-mail</option>
                                        <option value="EVP">Chave Aleatória (EVP)</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sua Chave PIX</label>
                                    <input 
                                        type="text" 
                                        value={pixKey}
                                        onChange={(e) => setPixKey(e.target.value)}
                                        placeholder="Ex: seu@email.com, CPF ou Chave Aleatória"
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleWithdraw}
                                disabled={isWithdrawing || !withdrawAmount || !pixKey}
                                className="btn-primary"
                                style={{ width: '100%', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (isWithdrawing || !withdrawAmount || !pixKey) ? 0.5 : 1 }}
                            >
                                {isWithdrawing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                Confirmar Saque
                            </button>
                        </div>
                    </div>
                )}
        </div>
    )
}

export default EditorDashboard
