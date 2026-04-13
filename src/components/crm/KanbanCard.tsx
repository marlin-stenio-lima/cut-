import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, MessageSquare, LayoutDashboard } from 'lucide-react'
import type { Deal } from '../../services/crm'

interface KanbanCardProps {
    deal: Deal
}

const KanbanCard: React.FC<KanbanCardProps> = ({ deal }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 999 : 1,
    }

    const contactName = deal.contact?.full_name || deal.lead?.full_name || 'Sem cliente'
    const whatsapp = deal.contact?.whatsapp || deal.lead?.whatsapp || ''
    const createdDate = new Date(deal.created_at)
    
    // Formatting functions
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(createdDate)
    const formattedValue = Number(deal.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    const targetDays = deal.crm_stages?.target_days || 7
    const daysInStage = Math.floor((Date.now() - createdDate.getTime()) / 86400000)
    const isOverdue = daysInStage > targetDays
    const stageOrder = deal.crm_stages?.order || 1
    const totalStages = 7 // Fixed across CRM Projetos

    // Initials for avatar
    const initials = contactName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

    // Determine the progress color
    let progressColor = 'var(--primary)'
    if (stageOrder === totalStages) progressColor = '#10b981' // Green when completed
    else if (isOverdue) progressColor = '#ef4444' // Red if overdue

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                padding: '16px',
                borderRadius: '16px',
                background: 'linear-gradient(145deg, rgba(30,30,35,0.7) 0%, rgba(20,20,25,0.9) 100%)',
                border: `1px solid ${isDragging ? 'var(--primary)' : isOverdue ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
                backdropFilter: 'blur(12px)',
                boxShadow: isDragging ? '0 12px 24px -10px rgba(99,102,241,0.4)' : '0 4px 12px -5px rgba(0,0,0,0.5)',
                userSelect: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden'
            }}
            {...attributes}
            {...listeners}
        >
            {/* Elegant top accent line to indicate state visually */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: isOverdue ? 'linear-gradient(90deg, transparent, #ef4444, transparent)' : `linear-gradient(90deg, transparent, ${progressColor}, transparent)`,
                opacity: 0.8
            }} />

            {/* Header: Title and value */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', margin: 0, lineHeight: 1.4, flex: 1 }}>
                    {deal.title || 'Novo Projeto Sem Título'}
                </p>
                {/* Visual indicator of days */}
                <span title={isOverdue ? 'Alvo ultrapassado' : 'Dias na etapa'} style={{ 
                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: 10, fontWeight: 500,
                    color: isOverdue ? '#ef4444' : 'var(--text-muted)',
                    background: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    padding: '4px 8px', borderRadius: '12px', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : 'transparent'}`
                }}>
                    <Clock size={10} /> 
                    {daysInStage}d {isOverdue && 'atraso'}
                </span>
            </div>

            {/* Client info with Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px'
                }}>
                    {initials}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-main)' }}>{contactName}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <LayoutDashboard size={10} /> {(deal.contact as any)?.works_completed ? `${(deal.contact as any).works_completed} projetos` : 'Novo cliente'}
                    </span>
                </div>
                {whatsapp && (
                    <a
                        href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="whatsapp-btn"
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: 28, height: 28, borderRadius: '8px',
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                            color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none'
                        }}
                    >
                        <MessageSquare size={13} />
                    </a>
                )}
            </div>

            {/* Financials & Dates */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Valor Estimado</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{formattedValue}</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Iniciado em</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-main)' }}>{formattedDate}</span>
                 </div>
            </div>

            {/* Progress Bar Indicators */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Avanço de projeto</span>
                    <span style={{ fontSize: 10, color: progressColor, fontWeight: 600 }}>{Math.round((stageOrder / totalStages) * 100)}%</span>
                </div>
                <div style={{ display: 'flex', gap: '3px' }}>
                    {Array.from({ length: totalStages }).map((_, i) => {
                        const isCompleted = i < stageOrder
                        const isCurrent = i === stageOrder - 1
                        return (
                            <div key={i} style={{
                                flex: 1,
                                height: '4px',
                                borderRadius: '4px',
                                background: isCompleted 
                                    ? (isCurrent && isOverdue ? '#ef4444' : progressColor) 
                                    : 'rgba(255,255,255,0.06)',
                                transition: 'all 0.3s',
                                boxShadow: isCurrent ? `0 0 8px ${progressColor}40` : 'none'
                            }} />
                        )
                    })}
                </div>
            </div>

        </div>
    )
}

export default KanbanCard
