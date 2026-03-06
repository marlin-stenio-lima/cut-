import React from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Video, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'

const ProfileSelectionPage: React.FC = () => {
    const navigate = useNavigate()
    const { user, refreshProfile, updateProfileLocally } = useAuth()
    const [isSubmitting, setIsSubmitting] = React.useState<string | null>(null)

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
                .update({
                    role: type,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (error) {
                console.error('Supabase error updating profile:', error)
                throw error
            }

            console.log(`Profile successfully updated to ${type}`)

            // Update AuthContext locally for an instant UI response
            updateProfileLocally({ role: type })

            // Fire refreshProfile in the background without awaiting it
            refreshProfile().catch(console.error)

            // Navigate to dashboard immediately
            navigate('/dashboard')

        } catch (error: any) {
            console.error('Error selecting profile:', error)
            alert(`Erro ao salvar seu perfil: ${error.message || 'Erro desconhecido'}`)
        } finally {
            setIsSubmitting(null)
        }
    }

    return (
        <div className="auth-container">
            <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', fontWeight: 700 }}>Como você quer usar o Cut House?</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '48px', fontSize: '1.1rem' }}>
                    Escolha o perfil que melhor descreve você para personalizarmos sua experiência.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    {/* Client Option */}
                    <button
                        onClick={() => handleSelectProfile('client')}
                        disabled={isSubmitting !== null}
                        className="glass"
                        style={{
                            padding: '48px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '24px',
                            background: 'transparent',
                            textAlign: 'center',
                            width: '100%',
                            opacity: isSubmitting && isSubmitting !== 'client' ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.borderColor = 'var(--accent)'
                                e.currentTarget.style.transform = 'translateY(-8px)'
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(7, 182, 213, 0.1)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--glass-border)'
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                    >
                        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(7, 182, 213, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={40} className="accent-cyan" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--text-main)' }}>Sou Cliente</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                Quero encontrar os melhores editores para meus projetos de vídeo.
                            </p>
                        </div>
                        <div style={{ marginTop: 'auto', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isSubmitting === 'client' ? (
                                <>Processando... <Loader2 size={18} className="spin" /></>
                            ) : (
                                <>Selecionar <CheckCircle size={18} /></>
                            )}
                        </div>
                    </button>

                    {/* Editor Option */}
                    <button
                        onClick={() => handleSelectProfile('editor')}
                        disabled={isSubmitting !== null}
                        className="glass"
                        style={{
                            padding: '48px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '24px',
                            background: 'transparent',
                            textAlign: 'center',
                            width: '100%',
                            opacity: isSubmitting && isSubmitting !== 'editor' ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.borderColor = 'var(--primary)'
                                e.currentTarget.style.transform = 'translateY(-8px)'
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(99, 102, 241, 0.1)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--glass-border)'
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                    >
                        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={40} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--text-main)' }}>Sou Editor</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                Quero trabalhar em projetos incríveis e mostrar meu portfólio.
                            </p>
                        </div>
                        <div style={{ marginTop: 'auto', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isSubmitting === 'editor' ? (
                                <>Processando... <Loader2 size={18} className="spin" /></>
                            ) : (
                                <>Selecionar <CheckCircle size={18} /></>
                            )}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProfileSelectionPage
