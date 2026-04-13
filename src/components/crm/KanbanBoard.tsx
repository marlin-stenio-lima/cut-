import React, { useState, useEffect } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import {
    arrayMove,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    SortableContext,
} from '@dnd-kit/sortable'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'
import { crmService } from '../../services/crm'
import type { Pipeline, Stage, Deal } from '../../services/crm'
import { supabase } from '../../services/supabase'
import { Loader2, Plus, RotateCcw, Search } from 'lucide-react'

const KanbanBoard: React.FC = () => {
    const [pipelines, setPipelines] = useState<Pipeline[]>([])
    const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null)
    const [stages, setStages] = useState<Stage[]>([])
    const [deals, setDeals] = useState<Deal[]>([])
    const [loading, setLoading] = useState(true)
    const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
    const [showLossModal, setShowLossModal] = useState(false)
    const [lossReasons] = useState<any[]>([])
    const [selectedLossReason, setSelectedLossReason] = useState('')
    const [lossNotes, setLossNotes] = useState('')
    const [dealForLoss, setDealForLoss] = useState<Deal | null>(null)
    const [search, setSearch] = useState('')

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const fetchAndMergeDeals = async (currentStages: Stage[]) => {
        const rawDeals = await crmService.getDeals()
        const [{ data: projects, error: projectsError }, { data: withdrawals }] = await Promise.all([
            supabase.from('projects').select('*, client:client_id(full_name, whatsapp), editor:editor_id(full_name, whatsapp), proposals(id)'),
            supabase.from('wallet_transactions').select('*, user:user_id(full_name, whatsapp)').eq('type', 'withdrawal').eq('status', 'PENDING')
        ])

        if (projectsError) console.error('[KanbanBoard] Erro ao carregar projetos:', projectsError)
        
        const mappedProjects = (projects || []).map(p => {
            let stageTarget = 'Novo projeto'
            
            if (p.status === 'Aberto') {
                if (p.proposals && p.proposals.length > 0) stageTarget = 'Proposta'
            } else if (p.status === 'Em Edição') {
                stageTarget = 'Projeto em edição'
            } else if (p.status === 'Revisão') {
                stageTarget = 'Projeto em aprovação'
            } else if (p.status === 'Análise' || p.status === 'Conflito' || p.status === 'Disputa') {
                stageTarget = 'Análise'
            } else if (p.status === 'Aguardando Pagamento' || p.status === 'Concluído') {
                stageTarget = 'Finalizado'
            }

            const tStage = currentStages.find(s => s.name === stageTarget) || currentStages[0]

            return {
                id: p.id,
                stage_id: tStage?.id,
                title: `[PLATAFORMA] ${p.title || 'Projeto'}`,
                value: p.final_price || p.budget || 0,
                status: 'open',
                contact: p.client,
                created_at: p.created_at,
                updated_at: p.created_at,
                is_platform: true
            }
        })

        const mappedWithdrawals = (withdrawals || []).map(w => {
            const tStage = currentStages.find(s => s.name === 'Pendentes de pagamento') || currentStages[currentStages.length - 1]
            return {
                id: w.id,
                stage_id: tStage?.id,
                title: `Saque R$ ${Number(w.amount).toFixed(2)}`,
                value: w.amount,
                status: 'open',
                contact: w.user,
                created_at: w.created_at,
                updated_at: w.created_at,
                is_withdrawal: true
            }
        })

        setDeals([...rawDeals, ...mappedProjects, ...mappedWithdrawals] as any[])
    }

    useEffect(() => { loadInitialData() }, [])

    const loadInitialData = async () => {
        setLoading(true)
        try {
            const pipes = await crmService.getPipelines()
            setPipelines(pipes)
            if (pipes.length > 0) {
                const firstPipe = pipes[0]
                setActivePipeline(firstPipe)
                let s = await crmService.getStages(firstPipe.id)
                if (s.length === 0) {
                    const defaults = [
                        { name: 'Novo projeto', order: 1, target_days: 2 },
                        { name: 'Proposta', order: 2, target_days: 3 },
                        { name: 'Em edição', order: 3, target_days: 5 },
                        { name: 'Em aprovação', order: 4, target_days: 2 },
                        { name: 'Análise', order: 5, target_days: 1 },
                        { name: 'Finalizado', order: 6, target_days: 0 },
                        { name: 'Pag. Pendente', order: 7, target_days: 3 },
                    ]
                    for (const d of defaults) await crmService.createStage({ pipeline_id: firstPipe.id, ...d })
                    s = await crmService.getStages(firstPipe.id)
                }
                setStages(s)
                await fetchAndMergeDeals(s)
            }
        } catch (err) { console.error(err) } finally { setLoading(false) }
    }

    const selectPipeline = async (pipeline: Pipeline) => {
        setLoading(true)
        setActivePipeline(pipeline)
        try {
            const s = await crmService.getStages(pipeline.id)
            setStages(s)
            await fetchAndMergeDeals(s)
        } catch (err) { console.error(err) } finally { setLoading(false) }
    }

    const onDragStart = (event: DragStartEvent) => {
        const deal = deals.find(d => d.id === event.active.id)
        if (deal) setActiveDeal(deal)
    }

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const isActiveADeal = deals.some(d => d.id === active.id)
        const isOverAStage = stages.some(s => s.id === over.id)
        if (isActiveADeal && isOverAStage) {
            setDeals(prev => {
                const idx = prev.findIndex(d => d.id === active.id)
                prev[idx].stage_id = over.id as string
                return arrayMove(prev, idx, idx)
            })
        }
    }

    const onDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveDeal(null)
        if (!over || active.id === over.id) return
        const deal = deals.find(d => d.id === active.id)
        if (deal) {
            try {
                const overDeal = deals.find(d => d.id === over.id)
                const targetStageId = overDeal ? overDeal.stage_id : (over.id as string)
                const targetStage = stages.find(s => s.id === targetStageId)
                if (targetStage && (targetStage.name.toLowerCase().includes('perdido') || targetStage.name.toLowerCase().includes('arquivado'))) {
                    if ((deal as any).is_platform || (deal as any).is_withdrawal) {
                        alert('Itens de plataforma ou financeiro não podem ser perdidos no Kanban. Cancele o status diretamente.')
                        return
                    }
                    setDealForLoss({ ...deal, stage_id: targetStageId })
                    setShowLossModal(true)
                    return
                }
                
                if ((deal as any).is_platform) {
                    let newStat = 'Aberto'
                    if (targetStage?.name === 'Proposta') newStat = 'Aberto'
                    else if (targetStage?.name === 'Projeto em edição') newStat = 'Em Edição'
                    else if (targetStage?.name === 'Projeto em aprovação') newStat = 'Revisão'
                    else if (targetStage?.name === 'Análise') newStat = 'Análise'
                    else if (targetStage?.name === 'Finalizado') newStat = 'Aguardando Pagamento'
                    else if (targetStage?.name === 'Pendentes de pagamento') {
                        alert('Projetos da plataforma não devem ser movidos para a área restrita de solicitações de saque dos editores.')
                        return
                    }
                    
                    await supabase.from('projects').update({ status: newStat }).eq('id', deal.id)
                } else if ((deal as any).is_withdrawal) {
                    alert('Os saques dos editores devem ser aprovados com segurança bancária diretamente na aba "Administração Financeira". Movimentações manuais no Kanban são bloqueadas para este item.')
                    return
                } else {
                    await crmService.updateDealStage(active.id as string, targetStageId)
                }
                
                setDeals(prev => prev.map(d => d.id === active.id ? { ...d, stage_id: targetStageId } : d))
            } catch (err) { console.error(err) }
        }
    }

    const handleConfirmLoss = async () => {
        if (!dealForLoss || !selectedLossReason) { alert('Selecione um motivo.'); return }
        try {
            await crmService.updateDealStage(dealForLoss.id, dealForLoss.stage_id)
            await crmService.setDealLost(dealForLoss.id, selectedLossReason, lossNotes)
            const d = await crmService.getDeals()
            setDeals(d)
            setShowLossModal(false); setDealForLoss(null); setSelectedLossReason(''); setLossNotes('')
        } catch { alert('Erro ao arquivar.') }
    }

    const filteredDeals = (stageId: string) =>
        deals.filter(d => d.stage_id === stageId && (
            !search ||
            d.title?.toLowerCase().includes(search.toLowerCase()) ||
            d.contact?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            d.lead?.full_name?.toLowerCase().includes(search.toLowerCase())
        ))

    if (loading && pipelines.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
            </div>
        )
    }

    if (!loading && pipelines.length === 0) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: 400, border: '1px dashed var(--glass-border)', borderRadius: 20,
                background: 'var(--bg-card)', textAlign: 'center', padding: 40
            }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>CRM não inicializado.</p>
                <button
                    onClick={async () => {
                        setLoading(true)
                        try { await crmService.setupDefaultPipeline(); window.location.reload() }
                        catch (err: any) { alert('Erro: ' + err.message); setLoading(false) }
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'var(--primary)' }}
                >
                    <Plus size={16} /> Inicializar CRM
                </button>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Board Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                {/* Pipeline selector */}
                {pipelines.length > 1 && (
                    <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                        {pipelines.map(p => (
                            <button
                                key={p.id}
                                onClick={() => selectPipeline(p)}
                                style={{
                                    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                                    background: activePipeline?.id === p.id ? 'var(--primary)' : 'transparent',
                                    color: activePipeline?.id === p.id ? '#fff' : 'var(--text-muted)',
                                    border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                                borderRadius: 10, padding: '7px 12px 7px 30px', fontSize: 13,
                                color: 'var(--text-main)', outline: 'none', width: 200
                            }}
                        />
                    </div>

                    <button
                        onClick={loadInitialData}
                        title="Atualizar"
                        style={{
                            width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer'
                        }}
                    >
                        <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10,
                            background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer'
                        }}
                    >
                        <Plus size={14} /> Novo Projeto
                    </button>
                </div>
            </div>

            {/* Board */}
            <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                >
                    <SortableContext items={stages.map(s => s.id)} strategy={horizontalListSortingStrategy}>
                        <div style={{ display: 'flex', gap: 16, minWidth: 'max-content', alignItems: 'flex-start' }}>
                            {stages.map(stage => (
                                <KanbanColumn
                                    key={stage.id}
                                    stage={stage}
                                    deals={filteredDeals(stage.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeDeal ? (
                            <div style={{ width: 300, opacity: 0.9, transform: 'rotate(2deg)', pointerEvents: 'none' }}>
                                <KanbanCard deal={activeDeal} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Loss Reason Modal */}
            {showLossModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.7)' }}>
                    <div style={{ width: '100%', maxWidth: 440, borderRadius: 20, background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>Por que foi perdido?</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Registre o motivo para melhorar os processos futuros.</p>
                        <select
                            value={selectedLossReason}
                            onChange={e => setSelectedLossReason(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontSize: 13, marginBottom: 12, outline: 'none' }}
                        >
                            <option value="" disabled>Selecione um motivo...</option>
                            {lossReasons.map(r => <option key={r.id} value={r.id}>{r.reason}</option>)}
                        </select>
                        <textarea
                            value={lossNotes}
                            onChange={e => setLossNotes(e.target.value)}
                            placeholder="Observações adicionais..."
                            style={{ width: '100%', height: 90, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontSize: 13, resize: 'none', outline: 'none', marginBottom: 20 }}
                        />
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => { setShowLossModal(false); setDealForLoss(null) }}
                                style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmLoss}
                                style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default KanbanBoard
