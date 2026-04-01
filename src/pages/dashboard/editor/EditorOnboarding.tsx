import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../context/ModalContext';
import { PenTool, BookOpen, Clock, Check, Loader2, Link as LinkIcon } from 'lucide-react';
import Logo from '../../../components/common/Logo';

const EditorOnboarding: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateProfileLocally } = useAuth();
    const { showAlert } = useModal();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [bio, setBio] = useState('');
    const [experienceYears, setExperienceYears] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    portfolio_url: portfolioUrl,
                    bio: bio,
                    experience_years: parseInt(experienceYears) || 0,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            updateProfileLocally({
                portfolio_url: portfolioUrl,
                bio: bio,
                experience_years: parseInt(experienceYears) || 0
            });

            showAlert('Sucesso!', 'Seu perfil foi configurado. Agora você pode explorar projetos!', 'success');
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err: any) {
            console.error('Error updating editor profile:', err);
            showAlert('Erro', 'Não foi possível salvar seu perfil: ' + err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '14px 16px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        color: 'var(--text-main)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.2s'
    };

    return (
        <div style={{ maxWidth: '640px', margin: '40px auto', padding: '0 20px', animation: 'fadeIn 0.5s ease-out' }}>
            <div className="glass" style={{ padding: '48px', borderRadius: '32px', border: '1px solid var(--glass-border)', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '24px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #06b6d4 100%)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                        boxShadow: '0 8px 16px rgba(7, 182, 213, 0.2)'
                    }}>
                        <PenTool size={40} color="white" />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', letterSpacing: '-0.02em' }}>
                        Perfil de Especialista
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto' }}>
                        Personalize sua presença na plataforma para atrair os melhores projetos.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>
                            🚀 Link do seu melhor Portfólio
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                                <BookOpen size={18} />
                            </div>
                            <input
                                type="url"
                                required
                                placeholder="Behance, YouTube ou Drive..."
                                style={{ ...inputStyle, paddingLeft: '48px' }}
                                value={portfolioUrl}
                                onChange={(e) => setPortfolioUrl(e.target.value)}
                            />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', marginLeft: '4px' }}>
                            Onde os clientes podem ver suas edições.
                        </p>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>
                            ✍️ Sua Bio / Especialidade
                        </label>
                        <textarea
                            required
                            placeholder="Ex: Editor de vídeos curtos especializado em Reels e TikTok com foco em retenção..."
                            style={{ ...inputStyle, minHeight: '140px', resize: 'none', lineHeight: '1.5' }}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>
                            ⏳ Anos de Experiência
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                                <Clock size={18} />
                            </div>
                            <input
                                type="number"
                                required
                                min="0"
                                placeholder="Ex: 5"
                                style={{ ...inputStyle, paddingLeft: '48px' }}
                                value={experienceYears}
                                onChange={(e) => setExperienceYears(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="glow-btn"
                        style={{
                            marginTop: '12px', padding: '18px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', gap: '12px',
                            fontWeight: 800, fontSize: '1.1rem', borderRadius: '16px'
                        }}
                    >
                        {isSubmitting ? (
                            <>Processando... <Loader2 className="animate-spin" size={22} /></>
                        ) : (
                            <>Ativar Perfil <Check size={22} /></>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditorOnboarding;
