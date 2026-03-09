import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import { PenTool, BookOpen, Clock, Check, Loader2 } from 'lucide-react';

const EditorOnboarding: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateProfileLocally } = useAuth();
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

            navigate('/dashboard');
        } catch (err: any) {
            console.error('Error updating editor profile:', err);
            alert('Erro ao salvar perfil: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
            <div className="glass" style={{ padding: '40px', borderRadius: '24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '20px',
                        background: 'rgba(7, 182, 213, 0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                    }}>
                        <PenTool size={32} color="var(--accent)" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                        Complete seu Perfil de Editor
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Para começar a pegar projetos, precisamos conhecer seu trabalho.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 600 }}> Link do Portfólio (Behance, YouTube, Drive, etc.) *</label>
                        <div style={{ position: 'relative' }}>
                            <BookOpen size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="url"
                                required
                                className="auth-input"
                                placeholder="https://..."
                                style={{ paddingLeft: '44px' }}
                                value={portfolioUrl}
                                onChange={(e) => setPortfolioUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 600 }}>Breve Descrição / Bio *</label>
                        <textarea
                            required
                            className="auth-input"
                            placeholder="Conte um pouco sobre suas especialidades..."
                            style={{ minHeight: '120px', padding: '15px' }}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 600 }}>Anos de Experiência *</label>
                        <div style={{ position: 'relative' }}>
                            <Clock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="number"
                                required
                                min="0"
                                className="auth-input"
                                placeholder="Ex: 3"
                                style={{ paddingLeft: '44px' }}
                                value={experienceYears}
                                onChange={(e) => setExperienceYears(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary"
                        style={{
                            marginTop: '12px', padding: '16px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                    >
                        {isSubmitting ? (
                            <>Salvando... <Loader2 className="animate-spin" size={20} /></>
                        ) : (
                            <>Finalizar Cadastro <Check size={20} /></>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditorOnboarding;
