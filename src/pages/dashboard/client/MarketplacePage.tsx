import React, { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import { Star, ExternalLink } from 'lucide-react';

import EditorPortfolioModal from '../../../components/dashboard/EditorPortfolioModal';

const MarketplacePage: React.FC = () => {
    const [editors, setEditors] = useState<any[]>([]);
    const [selectedEditor, setSelectedEditor] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEditors = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'editor')
                .order('created_at', { ascending: false });
            
            setEditors(data || []);
            setLoading(false);
        };
        fetchEditors();
    }, []);

    return (
        <div style={{ padding: '40px', animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Marketplace de Editores</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Encontre os melhores talentos para transformar seus vídeos em conteúdo de alto impacto.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {loading ? (
                    <p>Carregando editores...</p>
                ) : editors.map(editor => (
                    <div key={editor.id} className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)', transition: 'all 0.3s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
                                {editor.full_name?.[0].toUpperCase() || editor.email?.[0].toUpperCase()}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editor.full_name || 'Editor Master'}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontSize: '0.9rem' }}>
                                    <Star size={14} fill="#fbbf24" /> 5.0 (Novo)
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '100px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700 }}>Premiere Pro</span>
                            <span style={{ padding: '4px 10px', borderRadius: '100px', background: 'rgba(7,182,213,0.1)', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700 }}>Dynamic Style</span>
                        </div>

                        <button 
                            onClick={() => setSelectedEditor(editor)}
                            className="glow-btn"
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <ExternalLink size={18} /> Ver Portfólio
                        </button>
                    </div>
                ))}
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
