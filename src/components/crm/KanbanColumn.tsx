import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import KanbanCard from './KanbanCard'
import type { Stage, Deal } from '../../services/crm'
import { Plus, MoreHorizontal } from 'lucide-react'

interface KanbanColumnProps {
    stage: Stage
    deals: Deal[]
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, deals }) => {
    const { setNodeRef, isOver } = useDroppable({ id: stage.id })

    const totalValue = deals.reduce((acc, d) => acc + Number(d.value || 0), 0)
    
    // Determine the color of the stage based on its order to create a nice visual gradient progression
    // 1 to 7 stages
    const hue = 220 + (stage.order * 20); // From blue towards purple
    const color = `hsl(${hue}, 80%, 65%)`

    return (
        <div style={{ 
            minWidth: 320, width: 320, display: 'flex', flexDirection: 'column', gap: 16,
            height: '100%' 
        }}>
            {/* Premium Column Header */}
            <div style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'linear-gradient(180deg, rgba(30,30,35,0.8) 0%, rgba(20,20,25,0.6) 100%)',
                border: '1px solid rgba(255,255,255,0.04)',
                boxShadow: '0 4px 20px -10px rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative glowing top line */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                    opacity: 0.6
                }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                            width: 8, height: 8, borderRadius: '50%', background: color,
                            boxShadow: `0 0 10px ${color}`
                        }} />
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', margin: 0, letterSpacing: '0.2px' }}>
                            {stage.name}
                        </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            fontSize: 12,
                            fontWeight: 600,
                            background: `rgba(255,255,255,0.05)`,
                            border: `1px solid rgba(255,255,255,0.1)`,
                            color: 'var(--text-main)',
                            padding: '2px 10px',
                            borderRadius: '12px',
                        }}>{deals.length}</span>
                        <button style={{ 
                            background: 'transparent', border: 'none', color: 'var(--text-muted)', 
                            cursor: 'pointer', padding: '4px', borderRadius: '4px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onMouseOver={e => e.currentTarget.style.color = 'var(--text-main)'}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                            <MoreHorizontal size={14} />
                        </button>
                    </div>
                </div>
                
                <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)'
                }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Volume total</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: totalValue > 0 ? '#10b981' : 'var(--text-muted)' }}>
                        {totalValue > 0
                            ? totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : 'R$ 0,00'}
                    </span>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                ref={setNodeRef}
                style={{
                    flex: 1,
                    minHeight: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    padding: 8,
                    borderRadius: 20,
                    border: `1px dashed ${isOver ? color : 'transparent'}`,
                    background: isOver ? `rgba(255,255,255,0.02)` : 'transparent',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                }}
            >
                <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
                    {deals.map(deal => (
                        <KanbanCard key={deal.id} deal={deal} />
                    ))}
                </SortableContext>

                <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '14px 0',
                    borderRadius: 14,
                    border: '1px dashed rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.01)',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginTop: 'auto',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(4px)'
                }}
                    onMouseOver={e => { 
                        (e.currentTarget as HTMLElement).style.borderColor = color; 
                        (e.currentTarget as HTMLElement).style.color = color;
                        (e.currentTarget as HTMLElement).style.background = `rgba(255,255,255,0.03)`;
                    }}
                    onMouseOut={e => { 
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; 
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.01)';
                    }}
                >
                    <Plus size={14} /> Novo Projeto
                </button>
            </div>
        </div>
    )
}

export default KanbanColumn
