import React from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Video, Loader2, MonitorPlay } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'

const ProfileSelectionPage: React.FC = () => {
    const navigate = useNavigate()
    const { user, profile, updateProfileLocally } = useAuth()
    const [isSubmitting, setIsSubmitting] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (profile?.role) {
            console.log('[ProfileSelection] User already has a role, redirecting to dashboard...')
            navigate('/dashboard')
        }
    }, [profile, navigate])

    const handleSelectProfile = async (type: 'client' | 'editor') => {
        if (!user) {
            console.error('No user found in auth context')
            return
        }

        console.log(`Starting profile update to ${type} for user ${user.id}...`)
        setIsSubmitting(type)

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    role: type,
                    updated_at: new Date().toISOString()
                })

            if (error) {
                console.error('Supabase error updating profile:', error)
                throw error
            }

            console.log(`Profile successfully updated to ${type}`)
            updateProfileLocally({ role: type })

            if (type === 'editor') {
                navigate('/dashboard/editor/onboarding')
            } else {
                navigate('/dashboard')
            }

        } catch (error: any) {
            console.error('Error selecting profile:', error)
            alert(`Erro ao salvar seu perfil: ${error.message || 'Erro desconhecido'}`)
        } finally {
            setIsSubmitting(null)
        }
    }

    return (
        <div className="futuristic-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontFamily: "'Inter', sans-serif", padding: '40px 20px' }}>

            <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#07b6d5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MonitorPlay size={24} color="#000" />
                    </div>
                </div>

                <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', marginBottom: '16px', fontWeight: 800, letterSpacing: '-0.02em' }}>Como você quer usar o Easy Content?</h1>
                <p style={{ color: '#888888', marginBottom: '48px', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 48px', lineHeight: 1.6 }}>
                    Escolha seu foco para personalizarmos sua área de trabalho e recomendarmos as melhores ferramentas.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                    {/* Client Option */}
                    <button
                        onClick={() => handleSelectProfile('client')}
                        disabled={isSubmitting !== null}
                        className="profile-option"
                        style={{
                            padding: '40px 32px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '24px',
                            background: 'rgba(5, 5, 5, 0.6)',
                            backdropFilter: 'blur(16px)',
                            textAlign: 'center',
                            width: '100%',
                            opacity: isSubmitting && isSubmitting !== 'client' ? 0.5 : 1
                        }}
                    >
                        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(7, 182, 213, 0.1)', border: '1px solid rgba(7, 182, 213, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={40} color="#07b6d5" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', color: '#ffffff', fontWeight: 700, letterSpacing: '-0.01em' }}>Sou Cliente</h3>
                            <p style={{ color: '#888888', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                Quero contratar os melhores editores para produzir os vídeos da minha empresa ou marca.
                            </p>
                        </div>
                        <div style={{ marginTop: 'auto', paddingTop: '16px', color: '#07b6d5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
                            {isSubmitting === 'client' ? (
                                <>Configurando conta... <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /></>
                            ) : (
                                <>Avançar como Cliente <ArrowRight size={18} /></>
                            )}
                        </div>
                    </button>

                    {/* Editor Option */}
                    <button
                        onClick={() => handleSelectProfile('editor')}
                        disabled={isSubmitting !== null}
                        className="profile-option"
                        style={{
                            padding: '40px 32px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '24px',
                            background: 'rgba(5, 5, 5, 0.6)',
                            backdropFilter: 'blur(16px)',
                            textAlign: 'center',
                            width: '100%',
                            opacity: isSubmitting && isSubmitting !== 'editor' ? 0.5 : 1
                        }}
                    >
                        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={40} color="#ffffff" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', color: '#ffffff', fontWeight: 700, letterSpacing: '-0.01em' }}>Sou Editor</h3>
                            <p style={{ color: '#888888', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                Quero trabalhar em projetos incríveis e monetizar minhas habilidades audiovisuais.
                            </p>
                        </div>
                        <div style={{ marginTop: 'auto', paddingTop: '16px', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
                            {isSubmitting === 'editor' ? (
                                <>Configurando conta... <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /></>
                            ) : (
                                <>Avançar como Editor <ArrowRight size={18} /></>
                            )}
                        </div>
                    </button>

                </div>
            </div>

            {/* Injected Styles */}
            <style>{`
                .profile-option:hover:not(:disabled) {
                    border-color: rgba(255, 255, 255, 0.15) !important;
                    background: rgba(10, 10, 10, 0.8) !important;
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                
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
    )
}

// ArrowRight needed to be added to imports, adding it inline via a small component mock to avoid a messy import rewrite:
const ArrowRight = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
)

export default ProfileSelectionPage
