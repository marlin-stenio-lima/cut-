import React, { useState, useEffect } from 'react'
import { 
    Shield, 
    Clock, 
    CheckCircle2, 
    Users, 
    TrendingUp, 
    Search,
    Filter,
    ArrowUpRight,
    Loader2,
    Check,
    X,
    Settings,
    DollarSign,
    CreditCard
} from 'lucide-react'
import { asaasService } from '../../services/asaas'
import { supabase } from '../../services/supabase'

const AdminDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([])
    const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(false)
    const [stats, setStats] = useState({
        totalBalance: 0,
        pendingTotal: 0,
        activeEditors: 0
    })

    // UI State
    const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [isActioning, setIsActioning] = useState<string | null>(null)
    const [commissionPercentage, setCommissionPercentage] = useState(10)
    const [isUpdatingFee, setIsUpdatingFee] = useState(false)
    const [pendingProjectPayouts, setPendingProjectPayouts] = useState<any[]>([])

    useEffect(() => {
        loadAdminData()
    }, [])

    const loadAdminData = async () => {
        console.log('[AdminDashboard] Loading analytical data...')
        setLoading(true)
        try {
            // 1. Fetch Platform Settings
            const { data: settings } = await supabase.from('platform_settings').select('*').eq('id', 'global').single()
            setAutoPayoutEnabled(settings?.auto_payout_enabled || false)
            setCommissionPercentage(settings?.commission_percentage || 10)

            // 2. Fetch Projects Awaiting Payout
            const { data: projectsData } = await supabase
                .from('projects')
                .select('*, client:client_id(full_name), editor:editor_id(full_name)')
                .eq('status', 'Aguardando Pagamento')
            
            setPendingProjectPayouts(projectsData || [])

            // 3. Fetch Pending Withdrawals with Profile info
            const { data: txs } = await supabase
                .from('wallet_transactions')
                .select(`
                    *,
                    profiles:user_id (full_name, email)
                `)
                .eq('status', 'AWAITING_APPROVAL')
                .order('created_at', { ascending: false })
            
            setPendingWithdrawals(txs || [])

            // 3. Stats (Quick Overview)
            const { data: profiles } = await supabase.from('profiles').select('balance')
            const totalBal = profiles?.reduce((acc, p) => acc + Number(p.balance || 0), 0) || 0
            const pendingTotal = txs?.reduce((acc, t) => acc + Number(t.amount || 0), 0) || 0

            setStats({
                totalBalance: totalBal,
                pendingTotal: pendingTotal,
                activeEditors: profiles?.length || 0
            })

        } catch (err: any) {
            console.error('[AdminDashboard] Critical Error:', err)
        } finally {
            console.log('[AdminDashboard] Loading finished.')
            setLoading(false)
        }
    }

    const handleToggleAuto = async () => {
        const newValue = !autoPayoutEnabled
        try {
            await asaasService.toggleAutoPayout(newValue)
            setAutoPayoutEnabled(newValue)
        } catch (err) {
            alert('Erro ao alterar configuração')
        }
    }

    const handleApprove = async (txId: string) => {
        if (!confirm('Deseja realmente aprovar este saque?')) return
        setIsActioning(txId)
        try {
            const res = await asaasService.approveWithdrawal(txId)
            if (res.success) {
                alert('Saque aprovado e processado pelo Asaas!')
                loadAdminData()
            }
        } catch (err: any) {
            alert(`Erro ao aprovar: ${err.message}`)
        } finally {
            setIsActioning(null)
        }
    }

    const handleReject = async () => {
        if (!showRejectModal || !rejectionReason) return
        setIsActioning(showRejectModal)
        try {
            const res = await asaasService.rejectWithdrawal(showRejectModal, rejectionReason)
            if (res.success) {
                alert('Saque recusado e valor estornado ao editor.')
                setShowRejectModal(null)
                setRejectionReason('')
                loadAdminData()
            }
        } catch (err: any) {
            alert(`Erro ao recusar: ${err.message}`)
        } finally {
            setIsActioning(null)
        }
    }
    const handleUpdateFee = async () => {
        setIsUpdatingFee(true)
        try {
            const { error } = await supabase
                .from('platform_settings')
                .update({ commission_percentage: commissionPercentage })
                .eq('id', 'global')

            if (error) throw error
            alert('Taxa da plataforma atualizada com sucesso!')
        } catch (err: any) {
            alert(`Erro ao atualizar taxa: ${err.message}`)
        } finally {
            setIsUpdatingFee(false)
        }
    }

    const handleReleaseProjectPayout = async (project: any) => {
        if (!confirm(`Deseja liberar o pagamento de R$ ${project.final_price} para o editor ${project.editor?.full_name}?`)) return
        
        setIsActioning(project.id)
        try {
            // Calculate payout
            const taxAmount = (Number(project.final_price) * commissionPercentage) / 100
            const netAmount = Number(project.final_price) - taxAmount

            // 1. Update Project Status
            const { error: projErr } = await supabase
                .from('projects')
                .update({ status: 'Concluído' })
                .eq('id', project.id)
            
            if (projErr) throw projErr

            // 2. Transaction Logic
            
            // Deduct from Client's Frozen Balance
            const { data: clientProfile } = await supabase.from('profiles').select('frozen_balance').eq('id', project.client_id).single()
            await supabase.from('profiles').update({ 
                frozen_balance: Number(clientProfile?.frozen_balance || 0) - Number(project.final_price) 
            }).eq('id', project.client_id)

            // Add to Editor's Available Balance
            const { data: editorProfile } = await supabase.from('profiles').select('balance').eq('id', project.editor_id).single()
            await supabase.from('profiles').update({ 
                balance: Number(editorProfile?.balance || 0) + netAmount 
            }).eq('id', project.editor_id)

            // Create Transaction record for Editor
            await supabase.from('wallet_transactions').insert({
                user_id: project.editor_id,
                amount: netAmount,
                type: 'PAYMENT',
                status: 'SUCCESS',
                description: `Pagamento do projeto: ${project.title} (Descontada taxa de ${commissionPercentage}%)`
            })

            alert('Pagamento liberado com sucesso!')
            loadAdminData()

        } catch (err: any) {
            alert(`Erro ao liberar pagamento: ${err.message}`)
        } finally {
            setIsActioning(null)
        }
    }

    if (loading && !pendingWithdrawals.length) {
        return (
            <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" color="var(--primary)" size={48} />
            </div>
        )
    }

    return (
        <div style={{ padding: '32px', color: 'var(--text-main)', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={18} color="var(--primary)" />
                        </div>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>PAINEL DE GOVERNANÇA</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Administração Financeira</h1>
                </div>

                {/* Auto-Payout Switch */}
                <div className="glass" style={{ padding: '16px 24px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--glass-border)' }}>
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Pagamentos Automáticos</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{autoPayoutEnabled ? 'Ativados (Fluxo instantâneo)' : 'Manual (Aprovação necessária)'}</div>
                    </div>
                    <button 
                        onClick={handleToggleAuto}
                        style={{
                            width: '52px', height: '28px', borderRadius: '100px',
                            background: autoPayoutEnabled ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            position: 'relative', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease'
                        }}
                    >
                        <div style={{
                            width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: '4px',
                            left: autoPayoutEnabled ? '28px' : '4px',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }} />
                    </button>
                </div>
            </div>

            {/* Quick Settings & Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                {/* Platform Fee Config */}
                <div className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(7, 182, 213, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Settings size={20} color="var(--accent)" />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Taxa da Plataforma</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
                            <input 
                                type="number" 
                                value={commissionPercentage}
                                onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700, outline: 'none' }}
                            />
                        </div>
                        <button 
                            onClick={handleUpdateFee}
                            disabled={isUpdatingFee}
                            className="btn-primary" 
                            style={{ padding: '0 24px', borderRadius: '12px' }}
                        >
                            {isUpdatingFee ? <Loader2 size={18} className="animate-spin" /> : 'Salvar'}
                        </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>Esta taxa será aplicada automaticamente no momento da liberação dos pagamentos aos editores.</p>
                </div>

                <div className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)', background: 'rgba(34, 197, 94, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DollarSign size={20} color="#22c55e" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Faturamento Previsto</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22c55e' }}>
                                R$ {pendingProjectPayouts.reduce((acc, p) => acc + (Number(p.final_price) * commissionPercentage / 100), 0).toFixed(2)}
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total de comissões aguardando liberação de projetos concluídos.</p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                {[
                    { label: 'Saldo Total Editors', value: `R$ ${stats.totalBalance.toLocaleString()}`, icon: <TrendingUp size={20} />, color: 'var(--primary)' },
                    { label: 'Saques na Fila', value: `R$ ${stats.pendingTotal.toLocaleString()}`, icon: <Clock size={20} />, color: '#fbbf24' },
                    { label: 'Editores Ativos', value: stats.activeEditors.toString(), icon: <Users size={20} />, color: '#2dd4bf' }
                ].map((s, i) => (
                    <div key={i} className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                {s.icon}
                            </div>
                            <ArrowUpRight size={18} color="rgba(255,255,255,0.2)" />
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Project Payouts Queue */}
            <div className="glass" style={{ borderRadius: '24px', border: '1px solid var(--glass-border)', overflow: 'hidden', marginBottom: '40px' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(7, 182, 213, 0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CreditCard size={20} className="accent-cyan" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Pagamentos de Projetos ({pendingProjectPayouts.length})</h2>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>PROJETO / CLIENTE</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>EDITOR</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>VALOR FINAL</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>A PAGAR (LÍQUIDO)</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingProjectPayouts.map((project) => {
                                const tax = (Number(project.final_price) * commissionPercentage) / 100
                                const net = Number(project.final_price) - tax
                                return (
                                    <tr key={project.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontWeight: 600 }}>{project.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cliente: {project.client?.full_name}</div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontSize: '0.9rem' }}>{project.editor?.full_name}</div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>R$ {Number(project.final_price).toFixed(2)}</div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent)' }}>R$ {net.toFixed(2)}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(-{commissionPercentage}% taxa)</div>
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => handleReleaseProjectPayout(project)}
                                                disabled={isActioning === project.id}
                                                className="btn-primary"
                                                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                            >
                                                {isActioning === project.id ? <Loader2 size={16} className="animate-spin" /> : 'Liberar Payout'}
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {pendingProjectPayouts.length === 0 && (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <p>Não há pagamentos de projetos aguardando liberação.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Withdrawal Queue Section */}
            <div className="glass" style={{ borderRadius: '24px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Fila de Aprovação ({pendingWithdrawals.length})</h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar editor..."
                                style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '100px', padding: '8px 16px 8px 36px', fontSize: '0.85rem', color: 'var(--text-main)', width: '200px' }}
                            />
                        </div>
                        <button style={{ padding: '8px 16px', borderRadius: '100px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                            <Filter size={14} /> Filtros
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>EDITOR</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>VALOR</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>DADOS PIX</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>SOLICITADO EM</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingWithdrawals.map((tx) => (
                                <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                                                {tx.profiles?.full_name?.charAt(0) || 'E'}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{tx.profiles?.full_name || 'Desconhecido'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.profiles?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>R$ {tx.amount.toLocaleString()}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tipo: {tx.metadata?.pixKeyType || 'PIX'}</span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500 }}>{tx.metadata?.pixKey || 'Não informada'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleString()}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => handleApprove(tx.id)}
                                                disabled={isActioning === tx.id}
                                                style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(74, 222, 128, 0.1)', border: 'none', color: '#4ade80', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                {isActioning === tx.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />}
                                            </button>
                                            <button 
                                                onClick={() => setShowRejectModal(tx.id)}
                                                disabled={isActioning === tx.id}
                                                style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {pendingWithdrawals.length === 0 && (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <CheckCircle2 size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                            <p>Tudo limpo! Não há saques pendentes no momento.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="glass" style={{ maxWidth: '400px', width: '100%', borderRadius: '24px', padding: '32px', border: '1px solid var(--glass-border)', background: 'var(--bg-deep)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Recusar Saque</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Informe o motivo para que o editor possa corrigir os dados.</p>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Motivo da Recusa</label>
                            <textarea 
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Ex: Chave PIX inválida ou CPF não bate com o titular..."
                                style={{ width: '100%', height: '100px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowRejectModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--bg-card)', border: 'none', color: 'var(--text-main)' }}>Cancelar</button>
                            <button 
                                onClick={handleReject}
                                disabled={!rejectionReason || isActioning !== null}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: 700 }}
                            >
                                {isActioning ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Recusa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Styles for Table Hover */}
            <style>{`
                table tr:hover { background: rgba(255,255,255,0.02); }
                .glow-switch:hover { box-shadow: 0 0 20px rgba(99, 102, 241, 0.2); }
            `}</style>
        </div>
    )
}

export default AdminDashboard
