import React from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Video, CheckCircle } from 'lucide-react'
import { supabase } from '../../services/supabase'

const ProfileSelectionPage: React.FC = () => {
    const navigate = useNavigate()

    const handleSelectProfile = async (type: 'client' | 'editor') => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        role: type,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id)

                if (error) {
                    throw error
                }

                console.log(`Profile updated to ${type} for user ${user.id}`)
                navigate('/dashboard')
            }
        } catch (error) {
            console.error('Error selecting profile:', error)
            alert('Erro ao salvar seu perfil. Por favor, tente novamente.')
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
                    <div
                        onClick={() => handleSelectProfile('client')}
                        className="glass"
                        style={{
                            padding: '48px',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '24px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent)'
                            e.currentTarget.style.transform = 'translateY(-8px)'
                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(7, 182, 213, 0.1)'
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
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Sou Cliente</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                Quero encontrar os melhores editores para meus projetos de vídeo.
                            </p>
                        </div>
                        <div style={{ marginTop: 'auto', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Selecionar <CheckCircle size={18} />
                        </div>
                    </div>

                    {/* Editor Option */}
                    <div
                        onClick={() => handleSelectProfile('editor')}
                        className="glass"
                        style={{
                            padding: '48px',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '24px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)'
                            e.currentTarget.style.transform = 'translateY(-8px)'
                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(99, 102, 241, 0.1)'
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
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Sou Editor</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                Quero trabalhar em projetos incríveis e mostrar meu portfólio.
                            </p>
                        </div>
                        <div style={{ marginTop: 'auto', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Selecionar <CheckCircle size={18} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfileSelectionPage
