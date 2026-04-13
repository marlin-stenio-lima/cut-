import React from 'react';
import { X, ExternalLink, Star, Play, Globe, MessageSquare, Youtube, MapPin, Award } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface EditorPortfolioModalProps {
    editor: any;
    onClose: () => void;
}

const EditorPortfolioModal: React.FC<EditorPortfolioModalProps> = ({ editor, onClose }) => {
    const { theme } = useTheme();
    if (!editor) return null;

    const skills = Array.isArray(editor.software_skills) ? editor.software_skills : [];
    const initial = (editor.full_name || editor.email || 'E')[0].toUpperCase();

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3000, padding: '20px',
            animation: 'fadeIn 0.3s ease-out'
        }} onClick={onClose}>
            <div style={{
                width: '100%', maxWidth: '900px', maxHeight: '92vh', overflowY: 'auto',
                borderRadius: '40px', position: 'relative',
                background: theme === 'dark' ? '#0a0a0a' : '#ffffff',
                color: theme === 'dark' ? '#ffffff' : '#111827',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
                padding: '0'
            }} onClick={e => e.stopPropagation()}>

                {/* Header/Cover Section */}
                <div style={{
                    height: '180px',
                    background: 'linear-gradient(135deg, #07b6d5, #8b5cf6, #ec4899)',
                    position: 'relative'
                }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))' }} />
                    <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex', backdropFilter: 'blur(10px)', transition: 'all 0.2s', zIndex: 10 }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '0 48px 48px', marginTop: '-60px', position: 'relative' }}>

                    {/* User Profile Info */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '28px', marginBottom: '48px' }}>
                        <div style={{
                            width: '120px', height: '120px', borderRadius: '32px',
                            background: 'linear-gradient(45deg, #07b6d5, #8b5cf6)',
                            border: theme === 'dark' ? '6px solid #0a0a0a' : '6px solid #fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '3rem', fontWeight: 800, color: 'white',
                            boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
                        }}>
                            {initial}
                        </div>
                        <div style={{ flex: 1, paddingBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>{editor.full_name || 'Editor Incrível'}</h2>
                                <span style={{ padding: '4px 12px', borderRadius: '100px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disponível</span>
                            </div>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontWeight: 700 }}>
                                    <Star size={18} fill="#fbbf24" /> 5.0 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Membro desde {editor.created_at ? new Date(editor.created_at).getFullYear() : '2024'})</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <MapPin size={16} color="#07b6d5" /> {editor.location || 'Brasil'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '56px' }}>

                        {/* Main Info Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                            <section>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Globe size={20} color="#07b6d5" /> Sobre o Editor
                                </h3>
                                <div style={{
                                    padding: '24px', borderRadius: '24px',
                                    background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                    lineHeight: '1.7', color: theme === 'dark' ? '#e2e8f0' : '#475569', fontSize: '1.05rem',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    {editor.motivation || editor.bio || 'Este editor é especialista em transformar vídeos brutos em experiências cinematográficas. Com foco em dinamismo e retenção, utiliza as melhores ferramentas do mercado para garantir um resultado impecável.'}
                                </div>
                            </section>

                            <section>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Play size={20} color="#ec4899" /> Vitrine de Portfólio
                                </h3>
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {editor.portfolio_links?.map((link: string, idx: number) => {
                                        const isInternalFile = link && !link.startsWith('http');
                                        return (
                                            <a
                                                key={idx}
                                                href={isInternalFile ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/editor-portfolio/${link}` : link}
                                                target="_blank" rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderRadius: '24px',
                                                    background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
                                                    border: '1px solid var(--glass-border)',
                                                    textDecoration: 'none', color: 'inherit', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}
                                                onMouseOver={e => { e.currentTarget.style.transform = 'translateX(8px)'; e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'; }}
                                                onMouseOut={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'; }}
                                            >
                                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {isInternalFile ? <Play size={20} color="#fff" /> : <Youtube size={20} color="#fff" />}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Visualizar Obra {idx + 1}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isInternalFile ? 'Arquivo Interno' : link}</div>
                                                </div>
                                                <ExternalLink size={18} color="var(--text-muted)" />
                                            </a>
                                        );
                                    })}
                                    {(!editor.portfolio_links || editor.portfolio_links.length === 0) && (
                                        <div style={{ padding: '40px', borderRadius: '32px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--glass-border)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            Nenhum link de portfólio externo cadastrado.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar Info Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={{ padding: '32px', borderRadius: '32px', background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Award size={18} color="#8b5cf6" /> Mastery Tools
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {skills.length > 0 ? skills.map((skill: string) => (
                                        <span key={skill} style={{ padding: '8px 16px', borderRadius: '14px', background: 'rgba(99,102,241,0.1)', color: '#8b5cf6', fontSize: '0.85rem', fontWeight: 800, border: '1px solid rgba(99,102,241,0.1)' }}>
                                            {skill}
                                        </span>
                                    )) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhuma ferramenta informada.</span>
                                    )}
                                </div>
                                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Experiência:</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{editor.editing_experience || 'Novato'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Disponibilidade:</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{editor.weekly_availability || 'Alta'}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="btn-primary"
                                style={{ width: '100%', padding: '20px', borderRadius: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)', transition: 'all 0.3s' }}
                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <MessageSquare size={20} /> Contratar Editor
                            </button>

                            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 10px' }}>
                                Ao clicar em contratar, você abrirá um canal direto de comunicação com este editor.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPortfolioModal;
