import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Clock, XCircle, LogOut } from 'lucide-react';
import Logo from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';

const EditorThanksPage: React.FC = () => {
    const { profile, signOut } = useAuth();

    const isRejected = profile?.onboarding_status === 'rejected';
    const isPending = profile?.onboarding_status === 'pending' || !profile?.onboarding_status;

    return (
        <div className="futuristic-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontFamily: "'Inter', sans-serif", padding: '40px 20px' }}>
            <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
                <div style={{ marginBottom: '48px' }}>
                    <Logo />
                </div>

                <div style={{ 
                    padding: '64px 40px', 
                    background: 'rgba(5, 5, 5, 0.6)', 
                    backdropFilter: 'blur(16px)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    borderRadius: '32px', 
                    boxShadow: '0 24px 48px rgba(0,0,0,0.5)' 
                }}>
                    <div style={{ 
                        width: '80px', height: '80px', borderRadius: '50%', 
                        background: isRejected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        margin: '0 auto 32px' 
                    }}>
                        {isRejected ? <XCircle size={40} color="#ef4444" /> : 
                         isPending ? <Clock size={40} color="#fbbf24" /> :
                         <CheckCircle size={40} color="#22c55e" />}
                    </div>

                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                        {isRejected ? 'Inscrição Recusada' : 'Aguardando Aprovação'}
                    </h1>
                    
                    <div style={{ color: '#a0a0a0', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '40px' }}>
                        {isRejected ? (
                            <>
                                <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: '16px' }}>Sentimos muito, mas sua inscrição não pôde ser aprovada no momento.</p>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Motivo da Recusa:</span>
                                    <p style={{ color: '#fff', fontSize: '0.95rem' }}>{profile?.onboarding_rejection_reason || 'Documentação incompleta ou portfólio insuficiente para os padrões atuais.'}</p>
                                </div>
                            </>
                        ) : (
                            <p>
                                Sua proposta está em análise pela nossa equipe de governança. <br />
                                <strong>Você receberá um retorno em breve por e-mail ou via dashboard.</strong>
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Link to="/" style={{ 
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '12px', 
                            color: '#fff', textDecoration: 'none', background: 'rgba(255,255,255,0.05)',
                            padding: '12px 24px', borderRadius: '14px', fontWeight: 600, fontSize: '0.95rem',
                            transition: 'all 0.2s'
                        }} className="hover-glass">
                            <ArrowLeft size={18} /> Voltar para a Home
                        </Link>
                        
                        <button 
                            onClick={() => signOut()}
                            style={{ 
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '12px', 
                                color: 'rgba(255,255,255,0.4)', textDecoration: 'none', background: 'transparent',
                                border: 'none', cursor: 'pointer',
                                padding: '12px 24px', borderRadius: '14px', fontWeight: 600, fontSize: '0.95rem',
                                transition: 'all 0.2s'
                            }} className="hover-text-white">
                            <LogOut size={18} /> Sair da conta
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .hover-text-white:hover { color: #fff !important; }
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
            `}</style>
        </div>
    );
};

export default EditorThanksPage;
