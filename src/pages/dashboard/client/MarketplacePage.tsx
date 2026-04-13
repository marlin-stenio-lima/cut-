import React, { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import { Star, ExternalLink, Search, Filter, Sparkles, MapPin, Briefcase } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import EditorPortfolioModal from '../../../components/dashboard/EditorPortfolioModal';

const MarketplacePage: React.FC = () => {
    const [editors, setEditors] = useState<any[]>([]);
    const [filteredEditors, setFilteredEditors] = useState<any[]>([]);
    const [selectedEditor, setSelectedEditor] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { theme } = useTheme();

    useEffect(() => {
        const fetchEditors = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'editor')
                .order('created_at', { ascending: false });

            const list = data || [];
            setEditors(list);
            setFilteredEditors(list);
            setLoading(false);
        };
        fetchEditors();
    }, []);

    useEffect(() => {
        const filtered = editors.filter(editor =>
            editor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            editor.software_skills?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setFilteredEditors(filtered);
    }, [searchQuery, editors]);

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px', animation: 'fadeIn 0.5s ease-out' }}>

            {/* Premium Header Section */}
            <header style={{
                marginBottom: '60px',
                padding: '60px',
                borderRadius: '40px',
                background: theme === 'dark' ? 'linear-gradient(135deg, rgba(7, 182, 213, 0.1), rgba(99, 102, 241, 0.1))' : 'linear-gradient(135deg, #f0f9ff, #f5f3ff)',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '100px', background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: '#07b6d5', fontSize: '0.9rem', fontWeight: 700, marginBottom: '24px' }}>
                        <Sparkles size={16} /> Elite de Editores
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em', background: theme === 'dark' ? 'linear-gradient(to right, #fff, #94A3B8)' : 'linear-gradient(to right, #111, #475569)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Marketplace de Editores
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.6 }}>
                        Conecte-se com os maiores talentos da edição de vídeo e leve seu conteúdo para o próximo nível.
                    </p>

                    {/* Search & Filter Bar */}
                    <div style={{ display: 'flex', gap: '16px', maxWidth: '800px', margin: '0 auto', background: theme === 'dark' ? 'rgba(0,0,0,0.3)' : '#fff', padding: '12px', borderRadius: '24px', border: '1px solid var(--glass-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search size={20} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Busque por nome ou ferramenta (ex: Premiere, After Effects)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
                            />
                        </div>
                        <button style={{ padding: '0 24px', borderRadius: '16px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Filter size={18} /> Filtrar
                        </button>
                    </div>
                </div>

                {/* Decorative background globs */}
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(7, 182, 213, 0.15)', filter: 'blur(80px)' }}></div>
                <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', filter: 'blur(80px)' }}></div>
            </header>

            {/* Editors Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="glass" style={{ height: '400px', borderRadius: '32px', border: '1px solid var(--glass-border)', animation: 'pulse 1.5s infinite' }}></div>
                    ))
                ) : filteredEditors.length > 0 ? (
                    filteredEditors.map(editor => (
                        <div
                            key={editor.id}
                            className="glass"
                            style={{
                                padding: '32px',
                                borderRadius: '32px',
                                border: '1px solid var(--glass-border)',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.borderColor = 'rgba(7, 182, 213, 0.3)';
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'var(--glass-border)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                                <div style={{
                                    width: '72px', height: '72px', borderRadius: '20px',
                                    background: 'linear-gradient(45deg, var(--primary), var(--secondary))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.8rem', fontWeight: 800, color: '#fff',
                                    boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)'
                                }}>
                                    {editor.full_name?.[0].toUpperCase() || editor.email?.[0].toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '4px' }}>{editor.full_name || 'Editor Master'}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 700 }}>
                                        <Star size={14} fill="#fbbf24" /> 5.0 <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>(Novo)</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <MapPin size={14} color="#07b6d5" /> {editor.location || 'Brasil'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <Briefcase size={14} color="#8b5cf6" /> {editor.editing_experience || 'Novato'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
                                {editor.software_skills?.slice(0, 3).map((skill: string) => (
                                    <span key={skill} style={{ padding: '6px 12px', borderRadius: '100px', background: theme === 'dark' ? 'rgba(7, 182, 213, 0.1)' : 'rgba(7, 182, 213, 0.05)', color: '#07b6d5', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(7, 182, 213, 0.1)' }}>
                                        {skill}
                                    </span>
                                ))}
                                {editor.software_skills?.length > 3 && (
                                    <span style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        +{editor.software_skills.length - 3}
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => setSelectedEditor(editor)}
                                className="btn-primary"
                                style={{ width: '100%', padding: '16px', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', transition: 'all 0.3s' }}
                            >
                                <ExternalLink size={18} /> Ver Perfil Completo
                            </button>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', background: 'rgba(255,255,255,0.02)', borderRadius: '40px', border: '1px dashed var(--glass-border)' }}>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Nenhum editor encontrado com esses critérios.</p>
                        <button onClick={() => setSearchQuery('')} style={{ marginTop: '20px', color: '#07b6d5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Limpar busca</button>
                    </div>
                )}
            </div>

            {selectedEditor && (
                <EditorPortfolioModal
                    editor={selectedEditor}
                    onClose={() => setSelectedEditor(null)}
                />
            )}
        </div>
    );
};

export default MarketplacePage;
