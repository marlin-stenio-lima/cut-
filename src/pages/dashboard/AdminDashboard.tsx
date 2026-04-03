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
    CreditCard,
    FileText,
    Eye,
    MapPin,
    Calendar,
    Briefcase,
    ExternalLink
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
    const [pendingEditors, setPendingEditors] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'finance' | 'editors'>('finance')
    const [viewingEditor, setViewingEditor] = useState<any | null>(null)
    const [showEditorRejectModal, setShowEditorRejectModal] = useState<string | null>(null)
    const [editorRejectionReason, setEditorRejectionReason] = useState('')

    useEffect(() => {
        loadAdminData()
    }, [])

    const loadAdminData = async () => {
        console.log('[AdminDashboard] Loading analytical data...')
        setLoading(true)
        try {
            // 1. Fetch Platform Settings
            const { data: settings } = await supabase.from('platform_settings').select('*').eq('id', 'global').single()
            if (settings) {
                setAutoPayoutEnabled(settings.auto_payout_enabled || false)
                setCommissionPercentage(settings.commission_percentage || 10)
            }

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

            // 4. Stats (Quick Overview)
            const { data: profiles } = await supabase.from('profiles').select('balance, role, onboarding_status')
            const totalBal = profiles?.reduce((acc, p) => acc + Number(p.balance || 0), 0) || 0
            const pendingTotal = txs?.reduce((acc, t) => acc + Number(t.amount || 0), 0) || 0

            setStats({
                totalBalance: totalBal,
                pendingTotal: pendingTotal,
                activeEditors: profiles?.filter(p => p.role === 'editor' && p.onboarding_status === 'approved').length || 0
            })

            // 5. Fetch Pending Editors
            const { data: candidates } = await supabase
                .from('profiles')
                .select('*')
                .eq('onboarding_status', 'pending')
                .order('updated_at', { ascending: false })
            
            setPendingEditors(candidates || [])

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
            const { data: tx } = await supabase.from('wallet_transactions').select('*').eq('id', txId).single()
            if (!tx) throw new Error('Transação não encontrada')

            const { data: profile } = await supabase.from('profiles').select('balance').eq('id', tx.user_id).single()
            const currentBalance = Number(profile?.balance || 0)

            if (currentBalance < tx.amount) {
                throw new Error('Saldo insuficiente no perfil para este saque.')
            }

            await supabase.from('profiles').update({ balance: currentBalance - tx.amount }).eq('id', tx.user_id)
            await supabase.from('wallet_transactions').update({ status: 'SUCCESS' }).eq('id', txId)

            alert('Saque aprovado com sucesso!')
            loadAdminData()
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
            await supabase.from('wallet_transactions').update({ 
                status: 'FAILED',
                description: `Saque Recusado: ${rejectionReason}`
            }).eq('id', showRejectModal)
            
            alert('Saque recusado.')
            setShowRejectModal(null)
            setRejectionReason('')
            loadAdminData()
        } catch (err: any) {
            alert(`Erro ao recusar: ${err.message}`)
        } finally {
            setIsActioning(null)
        }
    }

    const handleUpdateFee = async () => {
        setIsUpdatingFee(true)
        try {
            await supabase.from('platform_settings').update({ commission_percentage: commissionPercentage }).eq('id', 'global')
            alert('Taxa da plataforma atualizada!')
        } catch (err: any) {
            alert(`Erro: ${err.message}`)
        } finally {
            setIsUpdatingFee(false)
        }
    }

    const handleReleaseProjectPayout = async (project: any) => {
        if (!confirm(`Deseja liberar o pagamento de R$ ${project.final_price}?`)) return
        setIsActioning(project.id)
        try {
            const taxAmount = (Number(project.final_price) * commissionPercentage) / 100
            const netAmount = Number(project.final_price) - taxAmount

            await supabase.from('projects').update({ status: 'Concluído' }).eq('id', project.id)
            
            const { data: clientProfile } = await supabase.from('profiles').select('frozen_balance').eq('id', project.client_id).single()
            await supabase.from('profiles').update({ 
                frozen_balance: Number(clientProfile?.frozen_balance || 0) - Number(project.final_price) 
            }).eq('id', project.client_id)

            const { data: editorProfile } = await supabase.from('profiles').select('balance').eq('id', project.editor_id).single()
            await supabase.from('profiles').update({ 
                balance: Number(editorProfile?.balance || 0) + netAmount 
            }).eq('id', project.editor_id)

            await supabase.from('wallet_transactions').insert({
                user_id: project.editor_id,
                amount: netAmount,
                type: 'PAYMENT',
                status: 'SUCCESS',
                description: `Pagamento: ${project.title}`
            })

            alert('Pagamento liberado!')
            loadAdminData()
        } catch (err: any) {
            alert(`Erro: ${err.message}`)
        } finally {
            setIsActioning(null)
        }
    }

    const handleApproveEditor = async (editorId: string) => {
        setIsActioning(editorId)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ onboarding_status: 'approved', role: 'editor' })
                .eq('id', editorId)
            
            if (error) throw error
            alert('Editor aprovado!')
            setViewingEditor(null)
            loadAdminData()
        } catch (err: any) {
            alert(`Erro: ${err.message}`)
        } finally {
            setIsActioning(null)
        }
    }

    const handleRejectEditor = async () => {
        if (!showEditorRejectModal || !editorRejectionReason) return
        setIsActioning(showEditorRejectModal)
        try {
            await supabase.from('profiles').update({ 
                onboarding_status: 'rejected',
                onboarding_rejection_reason: editorRejectionReason
            }).eq('id', showEditorRejectModal)
            
            alert('Candidato recusado.')
            setShowEditorRejectModal(null)
            setEditorRejectionReason('')
            setViewingEditor(null)
            loadAdminData()
        } catch (err: any) {
            alert(`Erro: ${err.message}`)
        } finally {
            setIsActioning(null)
        }
    }

    if (loading && !pendingWithdrawals.length && !pendingEditors.length) {
        return (
            <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" color="var(--primary)" size={48} />
            </div>
        )
    }

    return (
        <div style={{ padding: '32px', color: 'var(--text-main)', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <Shield size={18} color="var(--primary)" />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>ADMINISTRAÇÃO</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Fila de Análise</h1>
                </div>

                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px' }}>
                    <button 
                        onClick={() => setActiveTab('finance')}
                        style={{ padding: '10px 20px', borderRadius: '12px', background: activeTab === 'finance' ? 'var(--primary)' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                    >
                        Financeiro
                    </button>
                    <button 
                        onClick={() => setActiveTab('editors')}
                        style={{ padding: '10px 20px', borderRadius: '12px', background: activeTab === 'editors' ? 'var(--primary)' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', position: 'relative' }}
                    >
                        Candidatos
                        {pendingEditors.length > 0 && (
                            <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '20px', height: '20px', background: '#ef4444', borderRadius: '50%', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingEditors.length}</span>
                        )}
                    </button>
                </div>
            </div>

            {activeTab === 'finance' ? (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                        <div className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
                            <h3>Taxa da Plataforma</h3>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <input type="number" value={commissionPercentage} onChange={(e) => setCommissionPercentage(Number(e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: '#fff' }} />
                                <button onClick={handleUpdateFee} className="btn-primary" style={{ padding: '0 24px' }}>Salvar</button>
                            </div>
                        </div>
                        <div className="glass" style={{ padding: '24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign color="#22c55e" /></div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Editores Ativos</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.activeEditors}</div>
                            </div>
                        </div>
                    </div>

                    <div className="glass" style={{ borderRadius: '24px', overflow: 'hidden', marginBottom: '40px' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}><h2>Payouts de Projetos</h2></div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}><th style={{ padding: '16px 24px' }}>PROJETO</th><th style={{ padding: '16px 24px' }}>EDITOR</th><th style={{ padding: '16px 24px' }}>VALOR</th><th style={{ padding: '16px 24px', textAlign: 'right' }}>AÇÃO</th></tr></thead>
                            <tbody>
                                {pendingProjectPayouts.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px 24px' }}>{p.title}</td>
                                        <td style={{ padding: '16px 24px' }}>{p.editor?.full_name}</td>
                                        <td style={{ padding: '16px 24px' }}>R$ {p.final_price}</td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <button onClick={() => handleReleaseProjectPayout(p)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Liberar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="glass" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}><h2>Saques Pendentes</h2></div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}><th style={{ padding: '16px 24px' }}>EDITOR</th><th style={{ padding: '16px 24px' }}>VALOR</th><th style={{ padding: '16px 24px' }}>PIX</th><th style={{ padding: '16px 24px', textAlign: 'right' }}>AÇÕES</th></tr></thead>
                            <tbody>
                                {pendingWithdrawals.map(tx => (
                                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px 24px' }}>{tx.profiles?.full_name}</td>
                                        <td style={{ padding: '16px 24px' }}>R$ {tx.amount}</td>
                                        <td style={{ padding: '16px 24px' }}>{tx.metadata?.pixKey}</td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleApprove(tx.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'none', cursor: 'pointer' }}><Check size={16} /></button>
                                                <button onClick={() => setShowRejectModal(tx.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="glass" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}><h2>Novos Candidatos</h2></div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}><th style={{ padding: '16px 24px' }}>NOME</th><th style={{ padding: '16px 24px' }}>VÍDEO / EXP</th><th style={{ padding: '16px 24px' }}>DATA</th><th style={{ padding: '16px 24px', textAlign: 'right' }}>AÇÃO</th></tr></thead>
                        <tbody>
                            {pendingEditors.map(editor => (
                                <tr key={editor.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px 24px' }}>{editor.full_name}</td>
                                    <td style={{ padding: '16px 24px' }}>{editor.editing_experience}</td>
                                    <td style={{ padding: '16px 24px' }}>{new Date(editor.updated_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <button onClick={() => setViewingEditor(editor)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Analisar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {viewingEditor && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                    <div className="glass" style={{ maxWidth: '1000px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '32px', padding: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                            <h2>Dossiê: {viewingEditor.full_name}</h2>
                            <button onClick={() => setViewingEditor(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><X /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="glass" style={{ padding: '20px', borderRadius: '20px' }}>
                                    <h3>Documentos de Verificação</h3>
                                    <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Identidade (RG/CNH)</p>
                                            {viewingEditor.identity_doc_url ? (
                                                <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/editor-identity/${viewingEditor.identity_doc_url}`} alt="ID" style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--glass-border)' }} />
                                            ) : <p style={{ fontSize: '0.9rem', opacity: 0.5 }}>Não anexado</p>}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Foto do Rosto (Selfie)</p>
                                            {viewingEditor.face_photo_url ? (
                                                <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/editor-face/${viewingEditor.face_photo_url}`} alt="Face" style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--glass-border)' }} />
                                            ) : <p style={{ fontSize: '0.9rem', opacity: 0.5 }}>Não anexada</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p><strong>Habilidades:</strong> {viewingEditor.software_skills?.join(', ')}</p>
                                <p style={{ marginTop: '12px' }}><strong>Motivação:</strong> {viewingEditor.motivation}</p>
                                <p style={{ marginTop: '12px' }}><strong>Portfolio:</strong></p>
                                <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                                    {viewingEditor.portfolio_links?.map((link: string, idx: number) => {
                                        const isInternalFile = link && !link.startsWith('http');
                                        if (isInternalFile) {
                                            return (
                                                <div key={idx} style={{ background: '#000', borderRadius: '12px', padding: '8px', border: '1px solid var(--glass-border)' }}>
                                                    <video 
                                                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/editor-portfolio/${link}`} 
                                                        controls 
                                                        style={{ width: '100%', borderRadius: '8px' }}
                                                    />
                                                </div>
                                            );
                                        }
                                        return (
                                            <a key={idx} href={link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <ExternalLink size={14} /> Ver link externo {idx + 1}
                                            </a>
                                        );
                                    })}
                                    {(!viewingEditor.portfolio_links || viewingEditor.portfolio_links.length === 0) && (
                                        <p style={{ opacity: 0.5 }}>Nenhum portfólio fornecido</p>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                                    <button onClick={() => setShowEditorRejectModal(viewingEditor.id)} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}>Recusar</button>
                                    <button onClick={() => handleApproveEditor(viewingEditor.id)} className="btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '14px' }}>Aprovar Agora</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showEditorRejectModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass" style={{ maxWidth: '400px', width: '100%', padding: '32px', borderRadius: '24px' }}>
                        <h3>Motivo da Recusa</h3>
                        <textarea value={editorRejectionReason} onChange={(e) => setEditorRejectionReason(e.target.value)} style={{ width: '100%', height: '120px', marginTop: '16px', padding: '12px', borderRadius: '12px', background: '#000', color: '#fff', border: '1px solid var(--glass-border)' }} />
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button onClick={() => setShowEditorRejectModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#333', border: 'none', color: '#fff' }}>Voltar</button>
                            <button onClick={handleRejectEditor} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#ef4444', border: 'none', color: '#fff' }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {showRejectModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass" style={{ maxWidth: '400px', width: '100%', padding: '32px', borderRadius: '24px' }}>
                        <h3>Motivo da Recusa (Saque)</h3>
                        <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} style={{ width: '100%', height: '120px', marginTop: '16px', padding: '12px', borderRadius: '12px', background: '#000', color: '#fff', border: '1px solid var(--glass-border)' }} />
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button onClick={() => setShowRejectModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#333', border: 'none', color: '#fff' }}>Voltar</button>
                            <button onClick={handleReject} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#ef4444', border: 'none', color: '#fff' }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminDashboard
