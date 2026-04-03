import React from 'react';
import { X, ExternalLink, Star, Play, Globe, MessageSquare, Instagram, Youtube } from 'lucide-react';

interface EditorPortfolioModalProps {
    editor: any;
    onClose: () => void;
}

const EditorPortfolioModal: React.FC<EditorPortfolioModalProps> = ({ editor, onClose }) => {
    if (!editor) return null;

    const skills = Array.isArray(editor.skills) ? editor.skills : [];
    const initial = (editor.full_name || editor.email || 'E')[0].toUpperCase();

    return (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 3000, padding: '20px' 
        }} onClick={onClose}>
            <div className="glass" style={{ 
                width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
                borderRadius: '32px', position: 'relative', border: '1px solid var(--glass-border)',
                background: 'var(--bg-card)', padding: '0'
            }} onClick={e => e.stopPropagation()}>
                
                {/* Header/Cover */}
                <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', opacity: 0.2, width: '100%' }} />
                
                <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                    <X size={20} />
                </button>

                <div style={{ padding: '0 40px 40px', marginTop: '-50px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', marginBottom: '32px' }}>
                        <div style={{ 
                            width: '100px', height: '100px', borderRadius: '24px', 
                            background: 'var(--primary)', border: '4px solid var(--bg-card)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontSize: '2.5rem', fontWeight: 800, color: 'white',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                        }}>
                            {initial}
                        </div>
                        <div style={{ paddingBottom: '8px' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>{editor.full_name || 'Editor Incrível'}</h2>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                {editor.rating && (
                                    <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                        <Star size={16} fill="#fbbf24" /> {Number(editor.rating).toFixed(1)}
                                    </span>
                                )}
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>• {editor.views_generated || '0'} visualizações geradas</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '40px' }}>
                        {/* Main Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Globe size={18} color="var(--primary)" /> Biografia
                                </h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                    {editor.bio || 'Este editor ainda não preencheu sua biografia. Mas seu talento é visível nos seus trabalhos! Especialista em edições dinâmicas para redes sociais.'}
                                </p>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Play size={18} color="var(--primary)" /> Amostras de Portfólio
                                </h3>
                                {editor.portfolio_url ? (
                                    <a href={editor.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ 
                                        display: 'block', padding: '20px', borderRadius: '20px', 
                                        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)',
                                        textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.2s'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Youtube color="#ef4444" />
                                            <div>
                                                <div style={{ fontWeight: 600 }}>Link do Portfólio Principal</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{editor.portfolio_url}</div>
                                            </div>
                                            <ExternalLink size={16} style={{ marginLeft: 'auto' }} />
                                        </div>
                                    </a>
                                ) : (
                                    <div style={{ padding: '32px', borderRadius: '20px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--glass-border)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        Nenhum link de portfólio externo cadastrado.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="glass" style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px' }}>Habilidades</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {skills.length > 0 ? skills.map((skill: string) => (
                                        <span key={skill} style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700 }}>
                                            {skill}
                                        </span>
                                    )) : (
                                        <>
                                            <span style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700 }}>Premiere Pro</span>
                                            <span style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(7,182,213,0.1)', color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 700 }}>After Effects</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <button className="glow-btn" style={{ width: '100%', padding: '16px', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                                <MessageSquare size={20} /> Contatar Editor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPortfolioModal;
