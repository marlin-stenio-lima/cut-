import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
    Shield, Users, TrendingUp, Loader2, X,
    DollarSign, Eye, Briefcase, ExternalLink, Search, Plus,
    CheckCircle, RotateCcw, Phone, Mail, MapPin,
    MessageSquare, Calendar, Star, Code, Clock, Trash2, MoreHorizontal
} from 'lucide-react'
import { asaasService } from '../../services/asaas'
import { supabase } from '../../services/supabase'
import KanbanBoard from '../../components/crm/KanbanBoard'

const AdminDashboard: React.FC = () => {
    const location = useLocation()
    const [loading, setLoading] = useState(true)
    const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([])
    const [systemBalance, setSystemBalance] = useState<number>(0) // Real-Time Asaas Balance
    const [stats, setStats] = useState({ pendingTotal: 0, activeEditors: 0 })
    const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [commissionPercentage, setCommissionPercentage] = useState(10)
    const [isUpdatingFee, setIsUpdatingFee] = useState(false)
    const [pendingEditors, setPendingEditors] = useState<any[]>([])
    const [allClients, setAllClients] = useState<any[]>([])
    const [allEditors, setAllEditors] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<string>('finance')
    const [viewingContact, setViewingContact] = useState<any | null>(null)
    const [showEditorRejectModal, setShowEditorRejectModal] = useState<string | null>(null)
    const [editorRejectionReason, setEditorRejectionReason] = useState('')
    const [editorUrls, setEditorUrls] = useState<{ identity: string, face: string }>({ identity: '', face: '' })
    const [leads, setLeads] = useState<any[]>([])
    const [leadSearch, setLeadSearch] = useState('')
    const [editorSearch, setEditorSearch] = useState('')
    const [editorFilter, setEditorFilter] = useState<'all' | 'pending'>('all')
    const [selectedEditors, setSelectedEditors] = useState<string[]>([])
    const [clientSearch, setClientSearch] = useState('')
    const [selectedClients, setSelectedClients] = useState<string[]>([])
    const [showLeadModal, setShowLeadModal] = useState(false)
    const [editingLead, setEditingLead] = useState<any | null>(null)
    const [leadForm, setLeadForm] = useState({ full_name: '', email: '', whatsapp: '', status: 'Novo', source: '', notes: '' })
    const [overviewStats, setOverviewStats] = useState({ totalRevenue: 0, commissionTotal: 0, completedProjects: 0, ongoingProjects: 0, statusCounts: {} as Record<string, number>, totalProjects: 0 })
    const [rawTxs, setRawTxs] = useState<any[]>([])
    const [rawProjects, setRawProjects] = useState<any[]>([])
    const [dashboardDateFilter, setDashboardDateFilter] = useState('30d')
    const [balanceAmount, setBalanceAmount] = useState('')
    const [isAdjustingBalance, setIsAdjustingBalance] = useState(false)
    useEffect(() => { loadAdminData() }, [])
    useEffect(() => {
        if (!rawTxs || !rawProjects) return;

        let filteredTxs = rawTxs;
        let filteredProjects = rawProjects;
        const now = new Date()

        if (dashboardDateFilter !== 'all') {
            const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, 'year': 365 }
            const diff = daysMap[dashboardDateFilter]
            if (diff) {
                const limitDate = new Date(now)
                limitDate.setDate(limitDate.getDate() - diff)
                filteredTxs = rawTxs.filter(tx => tx.created_at && new Date(tx.created_at) >= limitDate)
                filteredProjects = rawProjects.filter(p => p.created_at && new Date(p.created_at) >= limitDate)
            }
        }

        const rev = filteredTxs.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
        let cCount = 0; let oCount = 0;
        const sCounts: Record<string, number> = {}
        filteredProjects.forEach(p => {
            if (p.status === 'Concluído') cCount++;
            else if (p.status !== 'Cancelado') oCount++;
            sCounts[p.status] = (sCounts[p.status] || 0) + 1
        })

        setOverviewStats({
            totalRevenue: rev,
            commissionTotal: rev * (commissionPercentage / 100),
            completedProjects: cCount,
            ongoingProjects: oCount,
            statusCounts: sCounts,
            totalProjects: filteredProjects.length
        })
    }, [dashboardDateFilter, rawTxs, rawProjects, commissionPercentage, allClients.length, stats.activeEditors])

    useEffect(() => {
        if (location.pathname.includes('/leads')) setActiveTab('leads')
        else if (location.pathname.includes('/crm')) setActiveTab('crm')
        else if (location.pathname.includes('/clients')) setActiveTab('clients')
        else if (location.pathname.includes('/editors')) setActiveTab('editors')
        else if (location.pathname === '/dashboard/admin') setActiveTab('finance')
        else if (location.pathname === '/dashboard') setActiveTab('overview')
    }, [location.pathname])
    useEffect(() => {
        if (viewingContact) fetchSignedUrls(viewingContact)
        else setEditorUrls({ identity: '', face: '' })
    }, [viewingContact])

    const fetchSignedUrls = async (editor: any) => {
        try {
            const urls = { identity: '', face: '' }
            if (editor.identity_doc_url) {
                const { data } = await supabase.storage.from('editor-docs').createSignedUrl(editor.identity_doc_url, 3600)
                if (data) urls.identity = data.signedUrl
            }
            if (editor.face_photo_url) {
                const { data } = await supabase.storage.from('editor-docs').createSignedUrl(editor.face_photo_url, 3600)
                if (data) urls.face = data.signedUrl
            }
            setEditorUrls(urls)
        } catch (err) { console.error(err) }
    }

    const loadAdminData = async () => {
        setLoading(true)
        try {
            // Fetch profiles + email via auth join (requires a view or RPC)
            // We use the raw select and rely on email being stored at signup via trigger
            const [withDrRes, editors, configs, profiles, leadsData, projectsReq, txsReq] = await Promise.all([
                supabase.from('wallet_transactions').select('*, profiles:user_id(*)').eq('type', 'withdrawal').eq('status', 'PENDING'),
                supabase.from('profiles').select('*').eq('role', 'editor').eq('onboarding_status', 'pending'),
                supabase.from('system_configs').select('*'),
                supabase.from('profiles').select('*').order('updated_at', { ascending: false }),
                supabase.from('leads').select('*').order('created_at', { ascending: false }),
                supabase.from('projects').select('status, is_pool, created_at'),
                supabase.from('wallet_transactions').select('amount, created_at, user_id').in('type', ['deposit', 'TOPUP', 'PAYMENT']).eq('status', 'SUCCESS')
            ])

            const withDr: any[] = withDrRes.data || [];

            if (projectsReq.data && txsReq.data) {
                setRawProjects(projectsReq.data)
                setRawTxs(txsReq.data)
                
                const platformCommissionMatch = configs.data?.find((c: any) => c.key === 'platform_commission')
                if (platformCommissionMatch) setCommissionPercentage(Number(platformCommissionMatch.value))
            }

            try {
                const asaasBal = await asaasService.getSystemBalance()
                if (asaasBal && typeof asaasBal.balance === 'number') {
                    setSystemBalance(asaasBal.balance)
                }
            } catch (e: any) {
                console.warn('[AdminDashboard] Failed to fetch Asaas Balance', e)
            }

            console.log('[AdminDashboard] profiles raw:', profiles.data, profiles.error)

            if (withDr) setPendingWithdrawals(withDr)
            if (editors.data) setPendingEditors(editors.data)
            if (configs.data) {
                const fee = configs.data.find((c: any) => c.key === 'platform_commission')
                if (fee) setCommissionPercentage(fee.value)
            }
            if (leadsData.data) {
                setLeads(leadsData.data)
            }
            if (profiles.data && profiles.data.length > 0) {
                const clients_profiles = profiles.data.filter((p: any) => p.role === 'client' || (!p.role && p.id !== profiles.data?.find((a: any) => a.role === 'admin')?.id))
                const editorsList = profiles.data.filter((p: any) => p.role === 'editor')
                console.log('[AdminDashboard] all roles:', profiles.data.map((p: any) => ({ name: p.full_name, role: p.role })))
                
                // Merge leads that are in the system so they appear in Base de Clientes
                const mappedLeads = (leadsData.data || []).map((l: any) => ({
                    id: l.id,
                    full_name: l.full_name,
                    email: l.email,
                    whatsapp: l.whatsapp,
                    created_at: l.created_at,
                    role: 'client',
                    is_lead: true,
                    status: l.status
                }));
                
                setAllClients([...clients_profiles, ...mappedLeads])
                setAllEditors(editorsList)
                setStats({
                    pendingTotal: withDr?.reduce((a: number, c: any) => a + (c.value || 0), 0) || 0,
                    activeEditors: editorsList.filter((p: any) => p.onboarding_status === 'approved').length
                })
            } else {
                console.warn('[AdminDashboard] No profiles returned. Error:', profiles.error)
                // Just set leads if profiles fail
                if (leadsData.data) {
                    setAllClients(leadsData.data.map((l: any) => ({...l, is_lead: true})))
                }
            }
        } catch (err) { console.error('[AdminDashboard] loadAdminData error:', err) } finally { setLoading(false) }
    }

    const handleUpdateFee = async () => {
        setIsUpdatingFee(true)
        try {
            await supabase.from('system_configs').upsert({ key: 'platform_commission', value: commissionPercentage }, { onConflict: 'key' })
        } catch (err) { alert('Erro ao atualizar') } finally { setIsUpdatingFee(false) }
    }
    const handleApproveWithdrawal = async (id: string, amount: number) => {
        if (!confirm(`⚠️ ALERTA DE SEGURANÇA - INTEGRAÇÃO ASAAS ⚠️\n\nVocê está prestes a aprovar uma transferência real de R$ ${amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})} via Asaas. O dinheiro sairá da sua conta instantaneamente para o usuário.\n\nTem certeza que deseja prosseguir com o pagamento PIX definitivo?`)) return
        try { await asaasService.approveWithdrawal(id); loadAdminData(); alert('Transferência aprovada com sucesso no Asaas!') } catch { alert('Erro na aprovação via Asaas.') }
    }
    const handleReject = async () => {
        if (!showRejectModal || !rejectionReason) return
        try { await asaasService.rejectWithdrawal(showRejectModal, rejectionReason); setShowRejectModal(null); setRejectionReason(''); loadAdminData() } catch { alert('Erro') }
    }
    const handleApproveEditor = async (id: string) => {
        try { await supabase.from('profiles').update({ onboarding_status: 'approved' }).eq('id', id); loadAdminData() } catch { alert('Erro') }
    }
    const handleRejectEditor = async () => {
        if (!showEditorRejectModal || !editorRejectionReason) return
        try {
            await supabase.from('profiles').update({ onboarding_status: 'rejected', rejection_reason: editorRejectionReason }).eq('id', showEditorRejectModal)
            setShowEditorRejectModal(null); setEditorRejectionReason(''); loadAdminData()
        } catch { alert('Erro') }
    }
    const handleSaveLead = async () => {
        try {
            if (editingLead) await supabase.from('leads').update(leadForm).eq('id', editingLead.id)
            else await supabase.from('leads').insert([leadForm])
            setShowLeadModal(false); setEditingLead(null)
            setLeadForm({ full_name: '', email: '', whatsapp: '', status: 'Novo', source: '', notes: '' })
            loadAdminData()
        } catch { alert('Erro ao salvar') }
    }
    const handleDeleteLead = async (id: string) => {
        if (!confirm('Excluir?')) return
        try { await supabase.from('leads').delete().eq('id', id); loadAdminData() } catch { alert('Erro') }
    }

    const handleAdjustBalance = async (type: 'TOPUP' | 'WITHDRAWAL') => {
        if (!viewingContact || viewingContact.role !== 'client' || !balanceAmount) return;
        const amount = Number(balanceAmount.replace(/\D/g, '')) / 100
        if (amount <= 0) return;
        
        setIsAdjustingBalance(true)
        try {
            const currentBal = Number(viewingContact.balance || 0);
            const newBal = type === 'TOPUP' ? currentBal + amount : currentBal - amount;

            const res = await supabase.from('profiles').update({ balance: newBal }).eq('id', viewingContact.id)
            if (res.error) throw res.error;

            await supabase.from('wallet_transactions').insert({
                user_id: viewingContact.id,
                amount: type === 'TOPUP' ? amount : amount, // UI logic keeps amount positive, type indicates direction
                type: type,
                status: 'SUCCESS',
                description: type === 'TOPUP' ? 'Adição de saldo via Admin' : 'Remoção de saldo via Admin'
            })

            // Update local state to reflect change instantly
            setViewingContact({ ...viewingContact, balance: newBal })
            setBalanceAmount('')
            loadAdminData()
        } catch (e: any) {
            alert('Erro ao ajustar saldo: ' + e.message)
        } finally {
            setIsAdjustingBalance(false)
        }
    }

    const filteredLeads = leads.filter(l =>
        l.full_name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
        l.email?.toLowerCase().includes(leadSearch.toLowerCase()) ||
        l.whatsapp?.includes(leadSearch)
    )

    const generateChartData = () => {
        const days = 14;
        const data = [];
        const now = new Date();
        now.setHours(0,0,0,0);
        let maxRev = 1;
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            
            const dayTxs = rawTxs.filter(tx => {
                if (!tx.created_at) return false;
                const txDate = new Date(tx.created_at);
                return txDate.getDate() === date.getDate() && txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear()
            })
            
            const rev = dayTxs.reduce((a,c)=>a+Number(c.amount),0)
            const com = rev * (commissionPercentage / 100)
            if (rev > maxRev) maxRev = rev;
            data.push({ date: dateStr, rev, com })
        }
        return { data, maxRev }
    }

    if (loading && !pendingWithdrawals.length && !pendingEditors.length) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
            </div>
        )
    }

    return (
        <div className="h-full overflow-y-auto" style={{ padding: '32px 40px', color: 'var(--text-main)', background: 'var(--bg-deep)' }}>
            <div style={{ maxWidth: 1600, margin: '0 auto' }}>

                {/* ─── Overview (Visão Geral) ─── */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Visão Geral</h2>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Métricas detalhadas de performance da plataforma.</p>
                            </div>
                            <select 
                                value={dashboardDateFilter} 
                                onChange={(e) => setDashboardDateFilter(e.target.value)}
                                style={{ padding: '10px 16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none' }}
                            >
                                <option value="7d">Últimos 7 dias</option>
                                <option value="30d">Últimos 30 dias</option>
                                <option value="90d">Últimos 90 dias</option>
                                <option value="year">Último ano</option>
                                <option value="all">Todo o período</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[
                                { label: 'Faturamento', value: `R$ ${overviewStats.totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, icon: TrendingUp, color: 'var(--primary)' },
                                { label: 'Comissão (Plataforma)', value: `R$ ${overviewStats.commissionTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, icon: DollarSign, color: '#10b981' },
                                { label: 'Clientes Ativos', value: allClients.length, icon: Users, color: '#3b82f6' },
                                { label: 'Editores Ativos', value: stats.activeEditors, icon: Star, color: '#f59e0b' },
                                { label: 'Projetos em Andamento', value: overviewStats.ongoingProjects.toString(), icon: Clock, color: '#8b5cf6' },
                                { label: 'Projetos Concluídos', value: overviewStats.completedProjects.toString(), icon: CheckCircle, color: '#ec4899' },
                            ].map((kpi, idx) => (
                                <div key={idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                                            <kpi.icon size={20} />
                                        </div>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{kpi.label}</p>
                                        <p style={{ color: 'var(--text-main)', fontSize: '28px', fontWeight: '800' }}>{kpi.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                             <div className="lg:col-span-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '32px' }}>
                                 <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-main)' }}>Fluxo de Caixa (Últimos 14 Dias)</h3>
                                 {(() => {
                                     const chart = generateChartData();
                                     return (
                                         <>
                                            <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 0 0 0', position: 'relative', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                                                {chart.data.map((day, idx) => (
                                                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ height: '240px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px', position: 'relative' }}>
                                                            <div style={{ width: '12px', height: `${Math.max((day.rev / chart.maxRev) * 100, 2)}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0', opacity: 0.9 }} title={`Faturamento: R$ ${day.rev.toFixed(2)}`}></div>
                                                            <div style={{ width: '12px', height: `${Math.max((day.com / chart.maxRev) * 100, 2)}%`, background: '#10b981', borderRadius: '4px 4px 0 0', opacity: 0.9 }} title={`Comissão: R$ ${day.com.toFixed(2)}`}></div>
                                                        </div>
                                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{day.date.substring(0,5)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: '24px', marginTop: '24px', justifyContent: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '4px' }}></div><span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Faturamento</span></div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '4px' }}></div><span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Comissão</span></div>
                                            </div>
                                         </>
                                     )
                                 })()}
                             </div>
                             <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '32px' }}>
                                 <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-main)' }}>Transações Recentes</h3>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                                     {rawTxs.slice(0, 7).map((tx, i) => (
                                         <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                 <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                     <DollarSign size={16} />
                                                 </div>
                                                 <div>
                                                     <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Depósito / Recarga</p>
                                                     <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleDateString('pt-BR')} às {new Date(tx.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                                                 </div>
                                             </div>
                                             <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                                                 +R$ {Number(tx.amount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                             </div>
                                         </div>
                                     ))}
                                     {rawTxs.length === 0 && (
                                         <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhuma transação encontrada.</p>
                                     )}
                                 </div>
                             </div>
                        </div>
                    </div>
                )}

                {/* ─── Finance Strategy (Asaas) ─── */}
                {activeTab === 'finance' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-main)', marginBottom: '8px' }}>
                                    <Shield size={24} style={{ color: '#10b981' }} />
                                    Administração Financeira (Asaas)
                                </h2>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gerenciamento de caixa e aprovação instantânea de transferências.</p>
                            </div>
                            <button onClick={loadAdminData} className="rounded-xl px-4 py-2 transition-all hover:bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                <RotateCcw size={14} /> Atualizar Agora
                            </button>
                        </div>
                        
                        {/* Caixa Tempo Real */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), transparent)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05, transform: 'scale(2.5)' }}><DollarSign size={200} /></div>
                                <p style={{ color: '#10b981', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                                    Saldo Em Conta Asaas (Real-time)
                                </p>
                                <p style={{ color: 'var(--text-main)', fontSize: '48px', fontWeight: '900', letterSpacing: '-1px' }}>
                                    R$ {systemBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px' }}>Dinheiro líquido disponível para transferências e saques dos editores.</p>
                            </div>

                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ajuste de Taxa / Comissão</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            <input
                                                type="number"
                                                value={commissionPercentage}
                                                onChange={e => setCommissionPercentage(Number(e.target.value))}
                                                className="w-full text-lg font-bold outline-none"
                                                style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '16px 20px', color: 'var(--text-main)' }}
                                            />
                                            <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>%</span>
                                        </div>
                                        <button onClick={handleUpdateFee} disabled={isUpdatingFee} className="transition-all hover:opacity-80" style={{ background: 'var(--primary)', color: '#fff', borderRadius: '16px', padding: '16px 24px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                                            {isUpdatingFee ? <Loader2 size={20} className="animate-spin" /> : 'Salvar'}
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Será retida automaticamente nos projetos</p>
                                </div>
                            </div>
                        </div>

                        {/* Approval Table */}
                        <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>Aprovação de Saques</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Estas solicitações farão transferências REAIS (Pix/TED) pela API do Asaas ao serem aprovadas.</p>
                                </div>
                                <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', inlineSize: 'fit-content', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' }}>
                                    {pendingWithdrawals.length} pendentes
                                </div>
                            </div>
                            
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--glass-border)' }}>
                                        <tr>
                                            <th style={{ padding: '16px 32px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Usuário / Data</th>
                                            <th style={{ padding: '16px 32px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total na Carteira</th>
                                            <th style={{ padding: '16px 32px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Saque Solicitado</th>
                                            <th style={{ padding: '16px 32px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Gatilho Asaas (Real-Time)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingWithdrawals.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '80px', textAlign: 'center' }}>
                                                    <CheckCircle size={40} style={{ margin: '0 auto 16px auto', color: '#10b981', opacity: 0.3 }} />
                                                    <p style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '16px' }}>Nenhuma solicitação pendente</p>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>A caixa de saques está limpa.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            pendingWithdrawals.map(w => (
                                                <tr key={w.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="hover:bg-[rgba(255,255,255,0.02)]">
                                                    <td style={{ padding: '24px 32px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                                                                {(w.profiles?.full_name?.[0] || 'E')}
                                                            </div>
                                                            <div>
                                                                <p style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '15px' }}>{w.profiles?.full_name || 'Usuário Desconhecido'}</p>
                                                                <p style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Clock size={12} /> {new Date(w.created_at || w.dateCreated).toLocaleDateString('pt-BR')} às {new Date(w.created_at || w.dateCreated).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '24px 32px' }}>
                                                        <span style={{ display: 'inline-flex', padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px' }}>
                                                            R$ {((w.value || 0) * 1.5).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '24px 32px' }}>
                                                        <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)' }}>
                                                            R$ {w.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                                                            <button 
                                                                onClick={() => setShowRejectModal(w.id)}
                                                                style={{ padding: '10px 20px', borderRadius: '12px', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                                                                className="hover:bg-[rgba(239,68,68,0.1)]"
                                                            >
                                                                Recusar
                                                            </button>
                                                            <button 
                                                                onClick={() => handleApproveWithdrawal(w.id, w.value || 0)}
                                                                style={{ padding: '10px 24px', borderRadius: '12px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}
                                                                className="hover:opacity-80 hover:-translate-y-0.5"
                                                            >
                                                                <DollarSign size={16} /> Aprovar Saque
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Approvals ─── */}
                {activeTab === 'approvals' && (
                    <div>
                        {pendingEditors.length === 0 ? (
                            <div className="py-20 text-center rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                <CheckCircle size={40} className="mx-auto mb-4 opacity-20" />
                                <p className="font-medium text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum candidato aguardando aprovação</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingEditors.map(editor => (
                                    <div
                                        key={editor.id}
                                        className="flex items-center justify-between px-6 py-4 rounded-2xl transition-all"
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                                style={{ background: 'var(--primary)' }}>
                                                {editor.full_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>{editor.full_name}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{editor.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setViewingContact(editor)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                                                style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
                                            >
                                                Ver perfil
                                            </button>
                                            {editor.portfolio_url && (
                                                <a
                                                    href={editor.portfolio_url}
                                                    target="_blank"
                                                    className="p-1.5 rounded-lg transition-all hover:opacity-80"
                                                    style={{ color: 'var(--primary)' }}
                                                >
                                                    <ExternalLink size={15} />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => setShowEditorRejectModal(editor.id)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                                            >
                                                Recusar
                                            </button>
                                            <button
                                                onClick={() => handleApproveEditor(editor.id)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-80"
                                                style={{ background: '#10b981' }}
                                            >
                                                Aprovar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Editors ─── */}
                {activeTab === 'editors' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)', margin: 0 }}>Base de Editores</h2>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                    {allEditors.length} contatos
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {selectedEditors.length > 0 && (
                                    <button 
                                        onClick={() => { if(confirm('Quer mesmo excluir?')) setSelectedEditors([]) }}
                                        className="rounded-xl text-xs font-medium transition-all hover:opacity-80"
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                                    >
                                        <Trash2 size={14} /> Excluir ({selectedEditors.length})
                                    </button>
                                )}

                                <button className="rounded-xl text-xs font-medium text-white transition-all hover:opacity-80"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary)' }}>
                                    <Plus size={14} /> Novo Editor
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', borderBottom: '1px solid var(--glass-border)' }}>
                           <button 
                               onClick={() => setEditorFilter('all')}
                               className="text-sm font-medium transition-all" 
                               style={{ padding: '12px 0', borderBottom: editorFilter === 'all' ? '2px solid var(--primary)' : '2px solid transparent', color: editorFilter === 'all' ? 'var(--primary)' : 'var(--text-muted)', background: 'transparent', outline: 'none' }}>
                               Todos os Editores
                           </button>
                           <button 
                               onClick={() => setEditorFilter('pending')}
                               className="text-sm font-medium transition-all" 
                               style={{ padding: '12px 0', borderBottom: editorFilter === 'pending' ? '2px solid #eab308' : '2px solid transparent', color: editorFilter === 'pending' ? '#eab308' : 'var(--text-muted)', background: 'transparent', outline: 'none' }}>
                               Aguardando Aprovação ({allEditors.filter(e => e.onboarding_status === 'pending').length})
                           </button>
                        </div>

                        {/* Filter Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '400px' }}>
                                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, email ou telefone..."
                                    value={editorSearch}
                                    onChange={e => setEditorSearch(e.target.value)}
                                    className="text-sm rounded-xl outline-none transition-all"
                                    style={{ width: '100%', padding: '10px 16px 10px 36px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                />
                            </div>

                            <button 
                                onClick={() => setEditorSearch('')}
                                className="text-sm rounded-xl transition-all hover:opacity-80" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', color: 'var(--text-muted)', background: 'transparent', border: 'none' }}>
                                Limpar
                            </button>
                        </div>

                        {/* Table */}
                        <div className="rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
                            <table style={{ width: '100%', fontSize: '14px', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                                <thead style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                                    <tr>
                                        <th style={{ padding: '16px', width: '48px', textAlign: 'center' }}>
                                            <input type="checkbox" className="rounded cursor-pointer" 
                                                   onChange={(e) => setSelectedEditors(e.target.checked ? allEditors.map(x=>x.id) : [])}
                                                   checked={selectedEditors.length === allEditors.length && allEditors.length > 0} />
                                        </th>
                                        <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Nome do contato</th>
                                        <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Telefone</th>
                                        <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>E-mail</th>
                                        <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Criado</th>
                                        <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Etiquetas</th>
                                        <th style={{ padding: '16px', width: '48px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allEditors.filter(e => {
                                        if (editorFilter === 'pending' && e.onboarding_status !== 'pending') return false;
                                        if (editorSearch && !e.full_name?.toLowerCase().includes(editorSearch.toLowerCase()) && !e.email?.toLowerCase().includes(editorSearch.toLowerCase())) return false;
                                        return true;
                                    }).length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '80px 16px', textAlign: 'center' }}>
                                                <Briefcase size={36} style={{ margin: '0 auto 12px auto', opacity: 0.2, color: 'var(--text-muted)' }} />
                                                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>Nenhum contato encontrado.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        allEditors.filter(e => {
                                            if (editorFilter === 'pending' && e.onboarding_status !== 'pending') return false;
                                            if (editorSearch && !e.full_name?.toLowerCase().includes(editorSearch.toLowerCase()) && !e.email?.toLowerCase().includes(editorSearch.toLowerCase())) return false;
                                            return true;
                                        }).map(e => (
                                            <tr key={e.id} className="transition-all hover:bg-[rgba(255,255,255,0.02)] cursor-pointer" style={{ borderBottom: '1px solid var(--glass-border)' }} onClick={() => setViewingContact(e)}>
                                                <td style={{ padding: '16px', textAlign: 'center' }} onClick={(ev) => ev.stopPropagation()}>
                                                    <input type="checkbox" className="rounded cursor-pointer" 
                                                           checked={selectedEditors.includes(e.id)}
                                                           onChange={(ev) => {
                                                               if(ev.target.checked) setSelectedEditors([...selectedEditors, e.id])
                                                               else setSelectedEditors(selectedEditors.filter(id => id !== e.id))
                                                           }} />
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, background: 'var(--primary)' }}>
                                                            {e.full_name?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <span style={{ fontWeight: '600', color: 'var(--text-main)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.full_name || '—'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                                        <Phone size={13} /> {e.whatsapp || '—'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                                        <Mail size={13} /> <span style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.email || '—'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                                    {e.created_at ? new Date(e.created_at).toLocaleDateString('pt-BR') : '—'}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                                                        background: e.onboarding_status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.15)',
                                                        color: e.onboarding_status === 'approved' ? '#10b981' : '#eab308',
                                                        border: `1px solid ${e.onboarding_status === 'approved' ? 'rgba(16,185,129,0.2)' : 'rgba(234,179,8,0.4)'}`
                                                    }}>
                                                        {e.onboarding_status === 'approved' ? 'Editor Ativo' : 'Pendente'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right' }} onClick={(ev) => ev.stopPropagation()}>
                                                    <button className="transition-all hover:bg-[rgba(255,255,255,0.05)]" style={{ padding: '8px', borderRadius: '8px', color: 'var(--text-muted)', border: 'none', background: 'transparent' }}>
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ─── Clients ─── */}
                {activeTab === 'clients' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)', margin: 0 }}>Base de Clientes</h2>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                    {allClients.length} contatos
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {selectedClients.length > 0 && (
                                    <button 
                                        onClick={() => { if(confirm('Quer mesmo excluir?')) setSelectedClients([]) }}
                                        className="rounded-xl text-xs font-medium transition-all hover:opacity-80"
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                                    >
                                        <Trash2 size={14} /> Excluir ({selectedClients.length})
                                    </button>
                                )}
                                <button 
                                    onClick={() => setShowLeadModal(true)}
                                    className="rounded-xl text-xs font-medium text-white transition-all hover:opacity-80"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--secondary)' }}>
                                    <Plus size={14} /> Novo Cliente
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', borderBottom: '1px solid var(--glass-border)' }}>
                           <button className="text-sm font-medium" style={{ padding: '12px 0', borderBottom: '2px solid var(--secondary)', color: 'var(--secondary)', background: 'transparent' }}>
                               Todos os Clientes
                           </button>
                        </div>

                        {/* Filter Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '400px' }}>
                                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, email ou telefone..."
                                    value={clientSearch}
                                    onChange={e => setClientSearch(e.target.value)}
                                    className="text-sm rounded-xl outline-none transition-all"
                                    style={{ width: '100%', padding: '10px 16px 10px 36px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                />
                            </div>

                            <button 
                                onClick={() => setClientSearch('')}
                                className="text-sm rounded-xl transition-all hover:opacity-80" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', color: 'var(--text-muted)', background: 'transparent', border: 'none' }}>
                                Limpar
                            </button>
                        </div>

                        {/* Table */}
                        <div className="rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
                            <table style={{ width: '100%', fontSize: '14px', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                                <thead style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                                    <tr>
                                        <th style={{ padding: '16px', width: '48px', textAlign: 'center' }}>
                                            <input type="checkbox" className="rounded cursor-pointer" 
                                                   onChange={(e) => setSelectedClients(e.target.checked ? allClients.map(x=>x.id) : [])}
                                                   checked={selectedClients.length === allClients.length && allClients.length > 0} />
                                        </th>
                                        <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Nome do contato</th>
                                        <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Telefone</th>
                                        <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>E-mail</th>
                                        <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Criado</th>
                                        <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Etiquetas</th>
                                        <th style={{ padding: '16px', width: '48px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allClients.filter(c => !clientSearch || c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) || c.email?.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '80px 16px', textAlign: 'center' }}>
                                                <Users size={36} style={{ margin: '0 auto 12px auto', opacity: 0.2, color: 'var(--text-muted)' }} />
                                                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>Nenhum cliente encontrado.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        allClients.filter(c => !clientSearch || c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) || c.email?.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                                            <tr key={c.id} className="transition-all hover:bg-[rgba(255,255,255,0.02)] cursor-pointer" style={{ borderBottom: '1px solid var(--glass-border)' }} onClick={() => setViewingContact(c)}>
                                                <td style={{ padding: '16px', textAlign: 'center' }} onClick={(ev) => ev.stopPropagation()}>
                                                    <input type="checkbox" className="rounded cursor-pointer" 
                                                           checked={selectedClients.includes(c.id)}
                                                           onChange={(ev) => {
                                                               if(ev.target.checked) setSelectedClients([...selectedClients, c.id])
                                                               else setSelectedClients(selectedClients.filter(id => id !== c.id))
                                                           }} />
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, background: 'var(--secondary)' }}>
                                                            {c.full_name?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <span style={{ fontWeight: '600', color: 'var(--text-main)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.full_name || '—'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                                        <Phone size={13} /> {c.whatsapp || '—'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                                        <Mail size={13} /> <span style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email || '—'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                                    {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—'}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', background: 'rgba(56,189,248,0.1)', color: 'var(--secondary)', border: '1px solid rgba(56,189,248,0.2)' }}>
                                                        Cliente Ativo
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right' }} onClick={(ev) => ev.stopPropagation()}>
                                                    <button className="transition-all hover:bg-[rgba(255,255,255,0.05)]" style={{ padding: '8px', borderRadius: '8px', color: 'var(--text-muted)', border: 'none', background: 'transparent' }}>
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ─── Leads ─── */}
                {activeTab === 'leads' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-sm">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar leads..."
                                    value={leadSearch}
                                    onChange={e => setLeadSearch(e.target.value)}
                                    className="w-full text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <button
                                onClick={() => { setEditingLead(null); setLeadForm({ full_name: '', email: '', whatsapp: '', status: 'Novo', source: '', notes: '' }); setShowLeadModal(true) }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
                                style={{ background: 'var(--primary)' }}
                            >
                                <Plus size={15} /> Novo Lead
                            </button>
                        </div>

                        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                            <table className="w-full text-sm">
                                <thead style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <tr>
                                        {['Nome', 'Contato', 'Status', 'Origem', ''].map(h => (
                                            <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map(lead => (
                                        <tr key={lead.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td className="px-6 py-3 font-medium" style={{ color: 'var(--text-main)' }}>{lead.full_name}</td>
                                            <td className="px-6 py-3" style={{ color: 'var(--text-muted)' }}>
                                                <span className="block">{lead.email}</span>
                                                <span className="text-xs">{lead.whatsapp}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="px-2 py-1 rounded-md text-xs font-medium"
                                                    style={{
                                                        background: lead.status === 'Convertido' ? 'rgba(16,185,129,0.1)' : lead.status === 'Negociando' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.05)',
                                                        color: lead.status === 'Convertido' ? '#10b981' : lead.status === 'Negociando' ? 'var(--primary)' : 'var(--text-muted)'
                                                    }}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3" style={{ color: 'var(--text-muted)' }}>{lead.source || '—'}</td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => { setEditingLead(lead); setLeadForm({ full_name: lead.full_name, email: lead.email, whatsapp: lead.whatsapp, status: lead.status, source: lead.source, notes: lead.notes }); setShowLeadModal(true) }}
                                                        style={{ color: 'var(--text-muted)' }} className="hover:opacity-60"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button onClick={() => handleDeleteLead(lead.id)} style={{ color: '#ef4444' }} className="hover:opacity-60">
                                                        <X size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredLeads.length === 0 && (
                                <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                                    <p className="text-sm">Nenhum lead encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── CRM ─── */}
                {activeTab === 'crm' && (
                    <KanbanBoard />
                )}
            </div>

            {/* ─── Modal: Viewing Contact ─── */}
            {viewingContact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
                    <div className="w-full max-w-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)' }}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold"
                                    style={{ background: viewingContact.role === 'client' ? 'var(--secondary)' : 'var(--primary)', fontSize: 16 }}>
                                    {viewingContact.full_name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="font-semibold" style={{ color: 'var(--text-main)' }}>{viewingContact.full_name || '—'}</p>
                                    <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                                        {viewingContact.role === 'client' ? 'Cliente' : 'Editor'}
                                        {viewingContact.onboarding_status === 'approved' && ' · Ativo'}
                                        {viewingContact.onboarding_status === 'pending' && ' · Pendente'}
                                        {viewingContact.onboarding_status === 'rejected' && ' · Recusado'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setViewingContact(null)} style={{ color: 'var(--text-muted)' }} className="hover:opacity-60">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-6">
                            {/* Contact Info */}
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Contato</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                        <Mail size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                        <div className="min-w-0">
                                            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</p>
                                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-main)' }}>{viewingContact.email || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                        <Phone size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>WhatsApp</p>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>{viewingContact.whatsapp || '—'}</p>
                                        </div>
                                    </div>
                                    {viewingContact.location && (
                                        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                            <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Localização</p>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>{viewingContact.location}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                        <Calendar size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Membro desde</p>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                                                {viewingContact.created_at ? new Date(viewingContact.created_at).toLocaleDateString('pt-BR') : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Editor-specific info */}
                            {viewingContact.role === 'editor' && (
                                <>
                                    {/* Skills & Experience */}
                                    <div className="p-5 rounded-2xl flex flex-col gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                        <div className="flex items-center gap-2">
                                            <Star size={16} style={{ color: 'var(--primary)' }} />
                                            <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Habilidades e Experiência</span>
                                        </div>
                                        <div className="flex flex-col gap-5">
                                            {viewingContact.software_skills?.length > 0 && (
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Softwares Dominados</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {viewingContact.software_skills.map((s: string) => (
                                                            <span key={s} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                                                style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {viewingContact.editing_experience && (
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Tempo de Experiência</p>
                                                    <p className="text-[15px] font-medium" style={{ color: 'var(--text-main)' }}>{viewingContact.editing_experience}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Availability & Price */}
                                    <div className="p-5 rounded-2xl flex flex-col gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} style={{ color: 'var(--primary)' }} />
                                            <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Disponibilidade & Valores</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Horas dedicadas/semana</p>
                                                <p className="text-[15px] font-medium" style={{ color: 'var(--text-main)' }}>{viewingContact.weekly_availability || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Pretensão de Ganhos</p>
                                                <p className="text-[15px] font-medium" style={{ color: 'var(--text-main)' }}>{viewingContact.price_expectation || '—'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Portfolio and Motivation */}
                                    <div className="p-5 rounded-2xl flex flex-col gap-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                        <div className="flex items-center gap-2">
                                            <Code size={16} style={{ color: 'var(--primary)' }} />
                                            <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Portfólio & Perfil Comportamental</span>
                                        </div>
                                        {viewingContact.portfolio_url && (
                                            <a href={viewingContact.portfolio_url} target="_blank" rel="noreferrer"
                                                className="flex items-center justify-between px-5 py-4 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                                                style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', color: 'var(--primary)', textDecoration: 'none', display: 'flex' }}>
                                                <span>Acessar Portfólio Externo</span>
                                                <ExternalLink size={15} />
                                            </a>
                                        )}
                                        {viewingContact.motivation && (
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Motivação Pessoal</p>
                                                <p className="text-[14px] p-4 rounded-xl leading-relaxed" style={{ color: 'var(--text-main)', background: 'var(--bg-deep)', border: '1px solid var(--glass-border)' }}>
                                                    {viewingContact.motivation}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bank Information (PIX) */}
                                    <div className="p-5 rounded-2xl flex items-center gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                                            <DollarSign size={24} style={{ color: '#10b981' }} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Chave PIX (Para Saques)</p>
                                            <p className="text-[16px] font-bold mt-1" style={{ color: 'var(--text-main)' }}>
                                                {viewingContact.pix_key ? `${viewingContact.pix_key_type || ''} - ${viewingContact.pix_key}` : 'Informação pendente ou via Asaas centralizado'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Documents */}
                                    {(editorUrls.identity || editorUrls.face) && (
                                        <div className="p-5 rounded-2xl flex flex-col gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                            <div className="flex items-center gap-2">
                                                <Shield size={16} style={{ color: 'var(--primary)' }} />
                                                <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Documentação & Segurança</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-5">
                                                {editorUrls.identity ? (
                                                    <div>
                                                        <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Documento Oficial (Frente/Verso)</p>
                                                        <img src={editorUrls.identity} alt="Doc" className="w-full h-40 object-cover rounded-xl border border-white/10" style={{ background: 'var(--bg-deep)' }} />
                                                    </div>
                                                ) : (
                                                    <div className="h-40 rounded-xl flex items-center justify-center text-xs" style={{ background: 'var(--bg-deep)', border: '1px dashed var(--glass-border)', color: 'var(--text-muted)' }}>Sem documento enviado</div>
                                                )}
                                                {editorUrls.face ? (
                                                    <div>
                                                        <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Selfie (Prova de vida)</p>
                                                        <img src={editorUrls.face} alt="Selfie" className="w-full h-40 object-cover rounded-xl border border-white/10" style={{ background: 'var(--bg-deep)' }} />
                                                    </div>
                                                ) : (
                                                    <div className="h-40 rounded-xl flex items-center justify-center text-xs" style={{ background: 'var(--bg-deep)', border: '1px dashed var(--glass-border)', color: 'var(--text-muted)' }}>Sem selfie enviada</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Approval Actions placed at the bottom for easy access */}
                                    {viewingContact.onboarding_status === 'pending' && (
                                        <div className="flex gap-4 pt-4 mt-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                                            <button
                                                onClick={() => { setViewingContact(null); setShowEditorRejectModal(viewingContact.id); }}
                                                className="flex-1 py-4 rounded-xl font-bold transition-all hover:opacity-80"
                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                            >
                                                RECUSAR PERFIL
                                            </button>
                                            <button
                                                onClick={() => { handleApproveEditor(viewingContact.id); setViewingContact(null); }}
                                                className="flex-1 py-4 rounded-xl font-bold text-white transition-all hover:opacity-80"
                                                style={{ background: '#10b981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                                            >
                                                APROVAR EDITOR
                                            </button>
                                        </div>
                                    )}

                                    {/* WhatsApp Quick Action */}
                                    {viewingContact.whatsapp && (
                                        <a
                                            href={`https://wa.me/${viewingContact.whatsapp.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white w-full transition-all hover:opacity-80"
                                            style={{ background: '#10b981', textDecoration: 'none', display: 'flex' }}
                                        >
                                            <MessageSquare size={18} /> Iniciar Conversa no WhatsApp
                                        </a>
                                    )}
                                </>
                            )}

                            {/* Client-specific: Info & Wallet */}
                            {viewingContact.role === 'client' && (
                                <>
                                    {/* Wallet Management */}
                                    <div className="p-5 rounded-2xl flex flex-col gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={16} style={{ color: 'var(--primary)' }} />
                                            <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Carteira do Cliente</span>
                                        </div>
                                        <div className="p-4 rounded-xl flex flex-col gap-1" style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)' }}>
                                            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Saldo Atual Disponível</p>
                                            <p className="text-3xl font-bold" style={{ color: 'var(--text-main)' }}>
                                                R$ {(Number(viewingContact.balance) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium" style={{ color: 'var(--text-muted)' }}>R$</span>
                                                <input
                                                    type="text"
                                                    value={balanceAmount}
                                                    onChange={(e) => {
                                                        const numeric = e.target.value.replace(/\D/g, '')
                                                        setBalanceAmount((Number(numeric) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
                                                    }}
                                                    placeholder="0,00"
                                                    className="w-full font-medium rounded-xl outline-none transition-all focus:border-cyan-500"
                                                    style={{ padding: '14px 14px 14px 44px', background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                                                    disabled={isAdjustingBalance}
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handleAdjustBalance('TOPUP')}
                                                disabled={isAdjustingBalance || !balanceAmount || balanceAmount === '0,00'}
                                                className="px-6 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                                style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                                            >
                                                Adicionar Saldo
                                            </button>
                                            <button 
                                                onClick={() => handleAdjustBalance('WITHDRAWAL')}
                                                disabled={isAdjustingBalance || !balanceAmount || balanceAmount === '0,00'}
                                                className="px-6 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                            >
                                                Remover Saldo
                                            </button>
                                        </div>
                                    </div>

                                    {/* Project Stats */}
                                    {(() => {
                                        const clientProjects = rawProjects.filter(p => p.client_id === viewingContact.id)
                                        const finishedCount = clientProjects.filter(p => ['Concluído', 'completed'].includes(p.status)).length
                                        return (
                                            <div className="p-5 rounded-2xl flex flex-col gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                                <div className="flex items-center gap-2">
                                                    <Briefcase size={16} style={{ color: 'var(--primary)' }} />
                                                    <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Métricas de Projetos</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-xl flex flex-col justify-center items-center text-center" style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)' }}>
                                                        <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Projetos Criados</p>
                                                        <p className="text-3xl font-bold" style={{ color: 'var(--text-main)' }}>{clientProjects.length}</p>
                                                    </div>
                                                    <div className="p-4 rounded-xl flex flex-col justify-center items-center text-center" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                                        <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: '#10b981' }}>Finalizados</p>
                                                        <p className="text-3xl font-bold text-green-500">{finishedCount}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })()}

                                    {/* Lead Data if exists */}
                                    {viewingContact.is_lead && (
                                        <div className="p-5 rounded-2xl flex flex-col gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                            <div className="flex items-center gap-2">
                                                <Search size={16} style={{ color: 'var(--primary)' }} />
                                                <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Dados Comerciais (CRM)</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                {viewingContact.source && (
                                                    <div>
                                                        <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Origem da Captação</p>
                                                        <p className="text-[15px] font-medium" style={{ color: 'var(--text-main)' }}>{viewingContact.source}</p>
                                                    </div>
                                                )}
                                                {viewingContact.status && (
                                                    <div>
                                                        <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Status no Funil</p>
                                                        <p className="text-[15px] font-medium" style={{ color: 'var(--text-main)' }}>{viewingContact.status}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* WhatsApp */}
                                    {viewingContact.whatsapp && (
                                        <a
                                            href={`https://wa.me/${viewingContact.whatsapp.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold text-white w-full transition-all hover:opacity-80"
                                            style={{ background: '#10b981', textDecoration: 'none', display: 'flex', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                                        >
                                            <MessageSquare size={18} /> Iniciar Conversa no WhatsApp
                                        </a>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Modal: Reject Withdrawal ─── */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)' }}>
                        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-main)' }}>Motivo da recusa</h3>
                        <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="Descreva o motivo..."
                            className="w-full h-28 rounded-xl px-4 py-3 text-sm outline-none resize-none mb-4"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowRejectModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>Cancelar</button>
                            <button onClick={handleReject} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: '#ef4444' }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Modal: Reject Editor ─── */}
            {showEditorRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)' }}>
                        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-main)' }}>Motivo da recusa</h3>
                        <textarea
                            value={editorRejectionReason}
                            onChange={e => setEditorRejectionReason(e.target.value)}
                            placeholder="Descreva o motivo..."
                            className="w-full h-28 rounded-xl px-4 py-3 text-sm outline-none resize-none mb-4"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowEditorRejectModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>Cancelar</button>
                            <button onClick={handleRejectEditor} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: '#ef4444' }}>Recusar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Modal: Lead Form ─── */}
            {showLeadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)' }}>
                        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>{editingLead ? 'Editar Lead' : 'Novo Lead'}</h3>
                            <button onClick={() => setShowLeadModal(false)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { label: 'Nome', key: 'full_name', placeholder: 'Nome completo' },
                                { label: 'Email', key: 'email', placeholder: 'email@example.com' },
                                { label: 'WhatsApp', key: 'whatsapp', placeholder: '+55 11 99999-9999' },
                                { label: 'Origem', key: 'source', placeholder: 'Instagram, Google...' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                                    <input
                                        value={(leadForm as any)[f.key]}
                                        onChange={e => setLeadForm({ ...leadForm, [f.key]: e.target.value })}
                                        placeholder={f.placeholder}
                                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</label>
                                <select
                                    value={leadForm.status}
                                    onChange={e => setLeadForm({ ...leadForm, status: e.target.value })}
                                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                                >
                                    {['Novo', 'Contatado', 'Negociando', 'Convertido', 'Arquivado'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Observações</label>
                                <textarea
                                    value={leadForm.notes}
                                    onChange={e => setLeadForm({ ...leadForm, notes: e.target.value })}
                                    placeholder="Anotações sobre o lead..."
                                    className="w-full h-24 rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
                            <button onClick={() => setShowLeadModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>Cancelar</button>
                            <button onClick={handleSaveLead} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--primary)' }}>
                                {editingLead ? 'Salvar' : 'Criar Lead'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminDashboard
