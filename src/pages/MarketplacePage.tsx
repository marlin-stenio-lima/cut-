import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Search, Filter, Star, CheckCircle2, 
    ArrowRight, MapPin, Award, PlayCircle, Loader2 
} from 'lucide-react';
import Logo from '../components/common/Logo';
import { supabase } from '../services/supabase';

interface EditorProfile {
    id: string;
    full_name: string;
    avatar_url: string;
    editing_experience: string;
    onboarding_status: string;
    software_skills: string[];
    video_formats: string[];
}

const MarketplacePage: React.FC = () => {
    const [editors, setEditors] = useState<EditorProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchApprovedEditors();
    }, []);

    const fetchApprovedEditors = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'editor')
                .eq('onboarding_status', 'approved');
            
            if (error) throw error;
            setEditors(data || []);
        } catch (err) {
            console.error('Error fetching editors:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredEditors = editors.filter(editor => 
        editor.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="futuristic-bg" style={{ minHeight: '100vh', color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Navbar */}
            <header style={{
                padding: '16px 5%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <Logo />
                    <nav style={{ display: 'flex', gap: '24px' }} className="desktop-nav">
                        <Link to="/" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }} className="hover-text-white">Início</Link>
                        <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem' }}>Marketplace</span>
                    </nav>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <Link to="/login" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, padding: '10px' }}>Entrar</Link>
                    <Link to="/register" style={{
                    padding: '10px 24px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#000000',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                }} className="btn-hover-scale">Criar Conta</Link>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ padding: '60px 10%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>Explore nossos Editores</h1>
                        <p style={{ color: '#888888', fontSize: '1.1rem' }}>Profissionais verificados e prontos para transformar sua ideia em vídeo.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} color="#666" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                type="text"
                                placeholder="Buscar editor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '12px 14px 12px 40px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    outline: 'none',
                                    width: '240px'
                                }}
                            />
                        </div>
                        <button style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', cursor: 'not-allowed' }}>
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 className="animate-spin" size={48} color="#07b6d5" />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px' }}>
                        {filteredEditors.map((editor) => (
                            <EditorCard key={editor.id} editor={editor} />
                        ))}

                        {filteredEditors.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <p style={{ color: '#666', fontSize: '1.1rem' }}>Nenhum editor encontrado para "{searchTerm}".</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <style>{`
                .btn-hover-scale:hover { transform: scale(1.05); }
                .hover-text-white:hover { color: #ffffff !important; }
                .futuristic-bg {
                    background-color: #000000;
                    background-image: 
                        radial-gradient(circle at 15% 50%, rgba(7, 182, 213, 0.08), transparent 25%),
                        radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.08), transparent 25%),
                        radial-gradient(ellipse at top, rgba(7, 182, 213, 0.2) 0%, transparent 40%),
                        radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.15) 0%, transparent 40%),
                        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
                    background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%, 40px 40px, 40px 40px;
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

const EditorCard: React.FC<{ editor: EditorProfile }> = ({ editor }) => {
    return (
        <div style={{
            background: 'rgba(5, 5, 5, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
        }} className="editor-card-hover">
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ 
                        width: '64px', height: '64px', borderRadius: '16px', 
                        background: 'linear-gradient(45deg, #07b6d5, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', fontWeight: 800, color: '#fff', overflow: 'hidden'
                    }}>
                        {editor.avatar_url ? (
                            <img src={editor.avatar_url} alt={editor.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : editor.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#000', borderRadius: '50%', padding: '2px' }}>
                        <CheckCircle2 size={16} color="#22c55e" fill="#000" />
                    </div>
                </div>
                <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '2px' }}>{editor.full_name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffb300' }}>
                        <Star size={14} fill="#ffb300" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>4.9</span>
                        <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 400 }}>(12 projetos)</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a0a0a0', fontSize: '0.85rem' }}>
                    <Award size={16} color="#07b6d5" />
                    <span>{editor.editing_experience || 'Experiência verificada'}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {editor.software_skills?.slice(0, 3).map(skill => (
                        <span key={skill} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.7rem', color: '#ccc' }}>
                            {skill}
                        </span>
                    ))}
                    {(editor.software_skills?.length || 0) > 3 && (
                        <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>+{(editor.software_skills?.length || 0) - 3} mais</span>
                    )}
                </div>
            </div>

            <Link 
                to="/register" 
                style={{
                    marginTop: 'auto',
                    width: '100%',
                    padding: '12px',
                    textAlign: 'center',
                    background: 'rgba(7, 182, 213, 0.1)',
                    border: '1px solid rgba(7, 182, 213, 0.2)',
                    borderRadius: '12px',
                    color: '#07b6d5',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                }}
                className="btn-hire-editor"
            >
                Contratar Editor <ArrowRight size={16} />
            </Link>

            <style>{`
                .editor-card-hover:hover {
                    transform: translateY(-8px);
                    border-color: rgba(7, 182, 213, 0.3) !important;
                    background: rgba(10, 10, 10, 0.8) !important;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                }
                .btn-hire-editor:hover {
                    background: #07b6d5 !important;
                    color: #fff !important;
                }
            `}</style>
        </div>
    );
};

export default MarketplacePage;
