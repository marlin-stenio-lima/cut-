import React, { useEffect, useState } from 'react'
import { Plus, Briefcase, Clock, CheckCircle, Loader2, CreditCard, Wallet, X, ChevronRight, Bell, User, Lock, Calendar, MapPin, ShieldCheck, Globe, FileText, Phone } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useModal } from '../../context/ModalContext'
import { supabase } from '../../services/supabase'
import { asaasService } from '../../services/asaas'

const StatsCard = ({ title, value, icon, color }: any) => (
    <div className="glass" style={{ padding: '16px 20px', borderRadius: '18px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ background: `${color}15`, padding: '12px', borderRadius: '12px', color: color }}>{icon}</div>
        <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '2px', fontWeight: 500 }}>{title}</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{value}</h3>
        </div>
    </div>
)

const ClientDashboard: React.FC = () => {
    const { user } = useAuth()
    const { showAlert, showToast } = useModal()
    const location = useLocation()
    
    // Add custom styles for the premium feel
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .glass-hover:hover {
                background: var(--glass-border) !important;
                border-color: var(--text-muted) !important;
                transform: translateY(-2px);
            }
            .glass-hover:active {
                transform: scale(0.98);
            }
        `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    const [projects, setProjects] = useState<any[]>([])
    const [proposals, setProposals] = useState<any[]>([])
    const [transactions, setTransactions] = useState<any[]>([])
    const [balance, setBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const [pixData, setPixData] = useState<any>(null)
    const [paymentId, setPaymentId] = useState<string | null>(null)
    const [isCreatingPayment, setIsCreatingPayment] = useState(false)
    const [isPaid, setIsPaid] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [depositStep, setDepositStep] = useState(1) // 1: Amount, 2: Method, 3: Pix Form, 4: Card Form, 5: Status
    const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX')
    const [filterStatus, setFilterStatus] = useState('ALL')
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        cpf: '',
        phone: '',
        amount: '',
        cardNumber: '',
        cardHolder: '',
        cardExpiry: '',
        cardCvv: '',
        postalCode: '',
        addressNumber: ''
    })

    const inputStyle = { 
        width: '100%', 
        padding: '12px 16px', 
        borderRadius: '12px', 
        background: 'var(--input-bg)', 
        border: '1px solid var(--glass-border)', 
        color: 'var(--text-main)',
        outline: 'none',
        fontSize: '0.95rem'
    }

    // Polling for payment status
    useEffect(() => {
        let interval: any;
        const checkStatus = async () => {
            if (!paymentId || isPaid) return
            try {
                const result = await asaasService.getPaymentStatus(paymentId)
                if (result.isPaid) {
                    setIsPaid(true)
                    clearInterval(interval)
                }
            } catch (err: any) {
                console.error("[Polling] Error:", err.message)
            }
        }

        if (paymentId && !isPaid) {
            checkStatus()
            interval = setInterval(checkStatus, 3000)
        }
        return () => { if (interval) clearInterval(interval) }
    }, [paymentId, isPaid])

    // Load Initial Data
    const loadDashboardData = async () => {
        if (!user) return
        try {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
            if (profile) {
                setBalance(profile.balance || 0)
                setFormData(prev => ({
                    ...prev,
                    name: prev.name || profile.full_name || '',
                    email: prev.email || profile.email || user.email || ''
                }))
            }

            const { data: projectsData } = await supabase
                .from('projects')
                .select('*')
                .eq('client_id', user.id)
                .order('created_at', { ascending: false })
            if (projectsData) setProjects(projectsData)

            // Load pending proposals for client's projects
            if (projectsData && projectsData.length > 0) {
                const projectIds = projectsData.map((p: any) => p.id)
                const { data: proposalsData } = await supabase
                    .from('proposals')
                    .select('*, editor:profiles!editor_id(full_name, avatar_url), project:projects!project_id(title, budget)')
                    .in('project_id', projectIds)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })
                    .limit(5)
                if (proposalsData) setProposals(proposalsData)
            }

            const txs = await asaasService.getTransactions()
            setTransactions(txs || [])
        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadDashboardData()
    }, [user])

    // Handling automatic deposit redirection
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const amount = params.get('amount');
        const isDeposit = params.get('deposit') === 'true';

        if (isDeposit && amount) {
            setFormData(prev => ({ ...prev, amount }));
            setShowForm(true);
            setDepositStep(2); // Go directly to Payment Method selection
            // Clean up the URL
            window.history.replaceState({}, document.title, "/dashboard");
        }
    }, [location.search]);

    // Stats calculations
    const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'Em Edição').length
    const reviewProjects = projects.filter(p => p.status === 'review' || p.status === 'Revisão' || p.status === 'Aguardando Pagamento').length
    const finishedProjects = projects.filter(p => p.status === 'completed' || p.status === 'Concluído').length
    const recentProjects = projects.slice(0, 4)

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 className="animate-spin" size={32} color="var(--accent)" />
            </div>
        )
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.02em' }}>
                    Olá, {formData.name.split(' ')[0] || 'Cliente'}! 👋
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Bem-vindo de volta ao seu centro de comando.</p>
            </header>

            {/* Main Content Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 360px', 
                gap: '16px',
                alignItems: 'start'
            }}>
                {/* Left Column: Stats & Projects */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Stats Grid */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                        gap: '12px' 
                    }}>
                        <StatsCard title="Ativos" value={activeProjects} icon={<Briefcase size={20} />} color="#38bdf8" />
                        <StatsCard title="Revisão" value={reviewProjects} icon={<Clock size={20} />} color="#fbbf24" />
                        <StatsCard title="Finalizados" value={finishedProjects} icon={<CheckCircle size={20} />} color="#4ade80" />
                    </div>

                    {/* Recent Projects Section */}
                    <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Projetos Recentes</h2>
                            <Link to="/dashboard/projects" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Ver todos</Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recentProjects.map(project => (
                                <div key={project.id} style={{ 
                                    padding: '12px 16px', 
                                    borderRadius: '16px', 
                                    background: 'var(--bg-card)', 
                                    border: '1px solid var(--glass-border)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '16px' 
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px' }}>{project.title}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{project.video_type}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ 
                                            fontSize: '0.85rem', 
                                            fontWeight: 700, 
                                            color: (project.status === 'in_progress' || project.status === 'Em Edição') ? '#38bdf8' : 
                                                   (project.status === 'Aguardando Pagamento' || project.status === 'Revisão') ? '#fbbf24' : '#4ade80', 
                                            marginBottom: '4px' 
                                        }}>
                                            {(project.status === 'in_progress' || project.status === 'Em Edição') ? 'Em Produção' : 
                                             (project.status === 'Aguardando Pagamento' || project.status === 'Revisão') ? 'Em Revisão' : 'Concluído'}
                                        </div>
                                        <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ width: `${(project.status === 'Aguardando Pagamento' || project.status === 'Revisão') ? 100 : project.progress}%`, height: '100%', background: 'var(--accent)' }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {recentProjects.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum projeto iniciado.</div>}
                        </div>
                    </div>

                    {/* ── Received Proposals Section ── */}
                    <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Propostas Recebidas</h2>
                                {proposals.length > 0 && (
                                    <span style={{
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        color: 'white', fontSize: '0.7rem', fontWeight: 800,
                                        padding: '2px 8px', borderRadius: '100px',
                                        boxShadow: '0 0 10px rgba(99,102,241,0.4)'
                                    }}>
                                        {proposals.length} nova{proposals.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <Link to="/dashboard/projects" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Ver projetos</Link>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {proposals.length === 0 ? (
                                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <Bell size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                    <p>Nenhuma proposta pendente.</p>
                                </div>
                            ) : proposals.map(prop => (
                                <Link
                                    key={prop.id}
                                    to="/dashboard/projects"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div style={{
                                        padding: '14px 16px',
                                        borderRadius: '16px',
                                        background: 'rgba(99,102,241,0.04)',
                                        border: '1px solid rgba(99,102,241,0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                                    >
                                        {/* Avatar */}
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, fontWeight: 800, fontSize: '0.9rem', color: 'white'
                                        }}>
                                            {prop.editor?.full_name?.[0]?.toUpperCase() || <User size={18} />}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px', color: 'var(--text-main)' }}>
                                                {prop.editor?.full_name || 'Editor'}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {prop.project?.title}
                                            </div>
                                        </div>

                                        {/* Price & Date */}
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#4ade80' }}>
                                                R$ {prop.offered_price || prop.project?.budget || '—'}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {new Date(prop.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                        </div>

                                        <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Wallet & History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Wallet Card */}
                    <div className="glass" style={{ 
                        padding: '20px', 
                        borderRadius: '20px', 
                        border: '1px solid var(--glass-border)',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, var(--bg-card) 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Saldo Disponível</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#4ade80', letterSpacing: '-0.02em' }}>
                                <span style={{ fontSize: '1.1rem', marginRight: '2px', opacity: 0.8 }}>R$</span>
                                {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <button 
                            onClick={() => { setDepositStep(1); setShowForm(true); }}
                            className="glow-btn"
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 600 }}
                        >
                            <Plus size={18} /> Adicionar Créditos
                        </button>
                    </div>

                    {/* Integrated History */}
                    <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Histórico</h2>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {['ALL', 'SUCCESS'].map(f => (
                                    <button 
                                        key={f} 
                                        onClick={() => setFilterStatus(f)}
                                        style={{ 
                                            padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                                            background: filterStatus === f ? 'var(--glass-border)' : 'transparent',
                                            color: filterStatus === f ? 'var(--text-main)' : 'var(--text-muted)'
                                        }}
                                    >
                                        {f === 'ALL' ? 'Tudo' : 'Sucesso'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {transactions
                                .filter(tx => filterStatus === 'ALL' || tx.status === filterStatus)
                                .slice(0, 6) // Show only latest in sidebar
                                .map(tx => (
                                <div key={tx.id} style={{ 
                                    padding: '12px 14px', 
                                    borderRadius: '16px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ 
                                            width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: tx.status === 'SUCCESS' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)'
                                        }}>
                                            {tx.status === 'SUCCESS' ? <CheckCircle size={16} color="#4ade80" /> : <Clock size={16} color="#fbbf24" />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Recarga</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, color: '#4ade80', fontSize: '0.9rem' }}>+R${Math.abs(tx.amount).toFixed(2)}</div>
                                    </div>
                                </div>
                            ))}
                            {transactions.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem movimentações.</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Success and Deposit Modals remain the same... */}
            {isPaid && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '32px', textAlign: 'center', border: '1px solid #4ade80' }}>
                        <div style={{ width: '80px', height: '80px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <CheckCircle size={48} color="#4ade80" />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px', color: '#4ade80' }}>Pagamento Confirmado!</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Seus créditos foram adicionados com sucesso à sua conta.</p>
                        <button onClick={() => { setIsPaid(false); setPixData(null); setPaymentId(null); setShowForm(false); loadDashboardData(); }} className="glow-btn" style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 600 }}>Voltar ao Dashboard</button>
                    </div>
                </div>
            )}

            {/* Deposit Modal Container */}
            {showForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: '20px' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '450px', padding: '32px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                        <button onClick={() => { setShowForm(false); setPixData(null); setPaymentId(null); }} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>

                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>Adicionar Saldo</h2>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Escolha como deseja carregar sua carteira.</p>
                        </div>

                        {/* Step 1: Amount */}
                        {depositStep === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
                                <div style={{ 
                                    background: 'rgba(255,255,255,0.03)', 
                                    padding: '32px', 
                                    borderRadius: '20px', 
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    textAlign: 'center'
                                }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 500 }}>Quanto deseja adicionar?</label>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 700, opacity: 0.5 }}>R$</span>
                                        <input 
                                            type="number" 
                                            placeholder="0,00" 
                                            value={formData.amount} 
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                                            style={{ 
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-main)',
                                                fontSize: '3rem',
                                                fontWeight: 800,
                                                width: '180px',
                                                outline: 'none',
                                                textAlign: 'center'
                                            }} 
                                        />
                                    </div>
                                </div>
                                <button 
                                    className="glow-btn" 
                                    disabled={!formData.amount || Number(formData.amount) < 5} 
                                    onClick={() => setDepositStep(2)} 
                                    style={{ padding: '20px', borderRadius: '16px', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)' }}
                                >
                                    Continuar
                                </button>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', opacity: 0.6 }}>Mínimo de R$ 5,00 para recarga.</p>
                            </div>
                        )}

                        {/* Step 2: Method Selection */}
                        {depositStep === 2 && (
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '16px', 
                                animation: 'modalSpring 0.4s cubic-bezier(.34,1.56,.64,1)' 
                            }}>
                                {/* PIX Option */}
                                <div 
                                    onClick={() => { setPaymentMethod('PIX'); setDepositStep(3); }} 
                                    className="glass-hover" 
                                    style={{ 
                                        padding: '24px', 
                                        borderRadius: '24px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '24px', 
                                        cursor: 'pointer', 
                                        border: '1px solid rgba(255,255,255,0.08)', 
                                        textAlign: 'left', 
                                        background: 'rgba(255,255,255,0.03)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ 
                                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))', 
                                        padding: '16px', 
                                        borderRadius: '18px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        boxShadow: '0 8px 16px rgba(34, 197, 94, 0.1)',
                                        border: '1px solid rgba(34, 197, 94, 0.2)'
                                    }}>
                                        <Wallet color="#4ade80" size={28} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontWeight: 800, marginBottom: '4px', fontSize: '1.2rem', color: 'white' }}>Pagar com PIX</h4>
                                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Liberação instantânea • 24h</p>
                                    </div>
                                    <div style={{ 
                                        width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' 
                                    }}>
                                        <ChevronRight size={20} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                    </div>
                                </div>

                                {/* Credit Card Option */}
                                <div 
                                    onClick={() => { setPaymentMethod('CREDIT_CARD'); setDepositStep(4); }} 
                                    className="glass-hover" 
                                    style={{ 
                                        padding: '24px', 
                                        borderRadius: '24px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '24px', 
                                        cursor: 'pointer', 
                                        border: '1px solid rgba(255,255,255,0.08)', 
                                        textAlign: 'left', 
                                        background: 'rgba(255,255,255,0.03)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ 
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.05))', 
                                        padding: '16px', 
                                        borderRadius: '18px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.1)',
                                        border: '1px solid rgba(99, 102, 241, 0.2)'
                                    }}>
                                        <CreditCard color="#818cf8" size={28} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontWeight: 800, marginBottom: '4px', fontSize: '1.2rem', color: 'white' }}>Cartão de Crédito</h4>
                                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Até 12x • Processamento imediato</p>
                                    </div>
                                    <div style={{ 
                                        width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' 
                                    }}>
                                        <ChevronRight size={20} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setDepositStep(1)} 
                                    style={{ 
                                        marginTop: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', 
                                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', 
                                        alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.6
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                >
                                    ← Voltar para o valor
                                </button>
                            </div>
                        )}

                        {/* Step 3: PIX Form */}
                        {depositStep === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <input type="text" placeholder="Nome Completo" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} />
                                <input type="text" placeholder="CPF (Apenas números)" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} style={inputStyle} />
                                <input type="text" placeholder="Telefone / WhatsApp" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={inputStyle} />
                                <button className="glow-btn" disabled={isCreatingPayment} onClick={async () => {
                                    setIsCreatingPayment(true);
                                    try {
                                        const res = await asaasService.createPixPayment(Number(formData.amount), 'Recarga de Saldo', { name: formData.name, email: formData.email, cpf: formData.cpf.replace(/\D/g, ''), phone: formData.phone.replace(/\D/g, '') });
                                        setPixData(res.pix); setPaymentId(res.payment.id); setDepositStep(5);
                                    } catch (err: any) { showAlert('Erro', err.message, 'error'); } finally { setIsCreatingPayment(false); }
                                }} style={{ padding: '16px', borderRadius: '12px', fontWeight: 700 }}>{isCreatingPayment ? 'Gerando...' : 'Gerar QR Code PIX'}</button>
                            </div>
                        )}

                        {/* Step 4: Card Form */}
                        {depositStep === 4 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'modalSpring 0.4s cubic-bezier(.34,1.56,.64,1)' }}>
                                {/* Virtual Card Preview */}
                                <div style={{ 
                                    height: '180px', width: '100%', 
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)',
                                    borderRadius: '20px', padding: '24px', 
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                    color: 'white', position: 'relative', overflow: 'hidden',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.1, transform: 'translate(20%, -20%)' }}>
                                        <Globe size={200} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                                        <div style={{ width: '45px', height: '35px', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                        {formData.cardNumber.startsWith('4') ? <div style={{ fontSize: '1.4rem', fontWeight: 900, fontStyle: 'italic', opacity: 0.8 }}>VISA</div> : 
                                         formData.cardNumber.startsWith('5') ? <div style={{ fontSize: '1.4rem', fontWeight: 900, fontStyle: 'italic', opacity: 0.8 }}>Mastercard</div> :
                                         <ShieldCheck size={24} style={{ opacity: 0.5 }} />}
                                    </div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '4px', textAlign: 'center', opacity: 0.9, position: 'relative', zIndex: 2, fontFamily: 'monospace' }}>
                                        {formData.cardNumber ? formData.cardNumber.padEnd(16, '*').replace(/(.{4})/g, '$1 ') : '**** **** **** ****'}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '4px' }}>Titular</p>
                                            <p style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>{formData.cardHolder || 'NOME NO CARTÃO'}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '4px' }}>Validade</p>
                                            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formData.cardExpiry || 'MM/AA'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* 1. Nome do Cliente */}
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}><User size={18} /></div>
                                        <input type="text" placeholder="Seu Nome Completo" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ ...inputStyle, paddingLeft: '48px' }} />
                                    </div>

                                    {/* 2. Telefone */}
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}><Phone size={18} /></div>
                                        <input type="text" placeholder="Seu Telefone / WhatsApp" value={formData.phone} 
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                let masked = val;
                                                if (val.length <= 11) {
                                                    masked = val.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
                                                }
                                                setFormData({...formData, phone: masked});
                                            }} style={{ ...inputStyle, paddingLeft: '48px' }} />
                                    </div>

                                    {/* 3. CPF */}
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}><FileText size={18} /></div>
                                        <input type="text" placeholder="CPF ou CNPJ do Titular" maxLength={18} value={formData.cpf} 
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                let masked = val;
                                                if (val.length <= 11) {
                                                    masked = val.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                                                } else {
                                                    masked = val.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
                                                }
                                                setFormData({...formData, cpf: masked});
                                            }} style={{ ...inputStyle, paddingLeft: '48px' }} />
                                    </div>

                                    {/* 4. Numero do Cartao */}
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}><CreditCard size={18} /></div>
                                        <input type="text" placeholder="Número do Cartão" maxLength={19} value={formData.cardNumber} 
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                                                setFormData({...formData, cardNumber: val});
                                            }} style={{ ...inputStyle, paddingLeft: '48px' }} />
                                    </div>

                                    {/* 5. Nome do Cartao */}
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}><User size={18} /></div>
                                        <input type="text" placeholder="Nome impresso no Cartão" value={formData.cardHolder} onChange={(e) => setFormData({...formData, cardHolder: e.target.value.toUpperCase()})} style={{ ...inputStyle, paddingLeft: '48px' }} />
                                    </div>

                                    {/* 6. Expiry & CVV */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}><Calendar size={18} /></div>
                                            <input type="text" placeholder="Validade (MM/AA)" maxLength={5} value={formData.cardExpiry} 
                                                onChange={(e) => {
                                                    let v = e.target.value.replace(/\D/g, '');
                                                    if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2,4);
                                                    setFormData({...formData, cardExpiry: v});
                                                }} style={{ ...inputStyle, paddingLeft: '48px' }} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}><Lock size={18} /></div>
                                            <input type="text" placeholder="CVV" maxLength={4} value={formData.cardCvv} onChange={(e) => setFormData({...formData, cardCvv: e.target.value.replace(/\D/g, '')})} style={{ ...inputStyle, paddingLeft: '48px' }} />
                                        </div>
                                    </div>

                                    {/* 7. CEP & Number */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}><MapPin size={18} /></div>
                                            <input type="text" placeholder="CEP" maxLength={9} value={formData.postalCode} 
                                                onChange={(e) => {
                                                    let v = e.target.value.replace(/\D/g, '');
                                                    if (v.length >= 5) v = v.substring(0,5) + '-' + v.substring(5,8);
                                                    setFormData({...formData, postalCode: v});
                                                }} style={{ ...inputStyle, paddingLeft: '48px' }} />
                                        </div>
                                        <input type="text" placeholder="Número residência" value={formData.addressNumber} onChange={(e) => setFormData({...formData, addressNumber: e.target.value})} style={inputStyle} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                                    <button className="glow-btn" disabled={isCreatingPayment} onClick={async () => {
                                        setIsCreatingPayment(true);
                                        try {
                                            const parts = formData.cardExpiry.split('/');
                                            const cardPayload = { 
                                                creditCard: { holderName: formData.cardHolder, number: formData.cardNumber.replace(/\s/g, ''), expiryMonth: parts[0], expiryYear: '20'+parts[1], ccv: formData.cardCvv },
                                                creditCardHolderInfo: { name: formData.name, email: formData.email, cpfCnpj: formData.cpf.replace(/\D/g, ''), postalCode: formData.postalCode.replace(/\D/g, ''), addressNumber: formData.addressNumber, phone: formData.phone.replace(/\D/g, '') }
                                            };
                                            const res = await asaasService.createCardPayment(Number(formData.amount), 'Recarga de Saldo', { name: formData.name, email: formData.email, cpf: formData.cpf, phone: formData.phone }, cardPayload);
                                            setPaymentId(res.payment.id); setDepositStep(5);
                                        } catch (err: any) { showAlert('Erro', err.message, 'error'); } finally { setIsCreatingPayment(false); }
                                    }} style={{ padding: '18px', borderRadius: '16px', fontWeight: 800, fontSize: '1.1rem' }}>
                                        {isCreatingPayment ? 'Processando Checkout...' : `Confirmar Pagamento • R$ ${formData.amount}`}
                                    </button>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.5 }}>
                                        <Lock size={12} />
                                        <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>Ambiente Seguro • Encriptação SSL</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setDepositStep(2)} 
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', opacity: 0.6 }}
                                >
                                    ← Alterar Método de Pagamento
                                </button>
                            </div>
                        )}

                        {/* Step 5: QR Code / Waiting */}
                        {depositStep === 5 && (
                            <div style={{ textAlign: 'center' }}>
                                {paymentMethod === 'PIX' && pixData ? (
                                    <>
                                        <div style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '24px' }}>
                                            <img src={`data:image/png;base64,${pixData.encodedImage}`} alt="QR Code" style={{ width: '200px', height: '200px' }} />
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginBottom: '24px', cursor: 'pointer', textAlign: 'left' }} onClick={() => { navigator.clipboard.writeText(pixData.payload); showToast('Código copiado!', 'success'); }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Copia e Cola:</p>
                                            <p style={{ fontSize: '0.8rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>{pixData.payload}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ padding: '40px 0' }}>
                                        <Loader2 size={48} className="animate-spin" style={{ color: '#38bdf8', marginBottom: '16px', margin: '0 auto' }} />
                                        <h4 style={{ fontWeight: 700 }}>Aguardando confirmação...</h4>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Assim que o pagamento for detectado, seu saldo subirá.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Integrated History logic was moved into the Right Column above */}
        </div>
    )
}

export default ClientDashboard
