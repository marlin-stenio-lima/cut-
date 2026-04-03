import { Mail, Lock, User, UserPlus, Eye, EyeOff, Phone } from 'lucide-react'
import Logo from '../../components/common/Logo'
import { supabase } from '../../services/supabase'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const RegisterPage: React.FC = () => {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const navigate = useNavigate()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.')
            setLoading(false)
            return
        }

        const timeout = setTimeout(() => {
            setLoading(false)
            setError('O cadastro está demorando além do normal. O servidor pode estar lento. Tente novamente em instantes.')
        }, 10000)

        try {
            console.log('[RegisterPage] Attempting signup for:', email)
            const { data, error: signupError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        phone: phone,
                        role: 'client'
                    }
                }
            })

            if (signupError) throw signupError

            if (data.user) {
                console.log('[RegisterPage] Signup success! Navigating to dashboard...')
                setTimeout(() => {
                    navigate('/dashboard')
                }, 1000)
            }
        } catch (err: any) {
            console.error('[RegisterPage] Registration error:', err.message)
            setError(err.message === 'User already registered'
                ? 'Este e-mail já está cadastrado.'
                : 'Erro ao criar conta: ' + err.message)
            setLoading(false)
        } finally {
            clearTimeout(timeout)
        }
    }

    return (
        <div className="futuristic-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontFamily: "'Inter', sans-serif", padding: '40px 20px' }}>

            <div style={{ width: '100%', maxWidth: '440px', padding: '48px', background: 'rgba(5, 5, 5, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>

                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <Logo />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>Criar sua conta</h1>
                    <p style={{ color: '#888888', fontSize: '0.95rem', lineHeight: 1.5 }}>Junte-se à maior plataforma premium para projetos de vídeo.</p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {error && (
                        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem', marginBottom: '8px' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a0a0a0' }}>Nome Completo</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} color="#666" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                name="name"
                                autoComplete="name"
                                placeholder="Seu Nome e Sobrenome"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '14px 16px 14px 44px', background: 'rgba(10, 10, 10, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
                                }}
                                className="input-focus"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a0a0a0' }}>E-mail corporativo ou pessoal</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="#666" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="email"
                                name="email"
                                autoComplete="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '14px 16px 14px 44px', background: 'rgba(10, 10, 10, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
                                }}
                                className="input-focus"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a0a0a0' }}>WhatsApp / Telefone</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} color="#666" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="tel"
                                name="phone"
                                placeholder="(00) 00000-0000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '14px 16px 14px 44px', background: 'rgba(10, 10, 10, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
                                }}
                                className="input-focus"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a0a0a0' }}>Senha</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="#666" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="new-password"
                                autoComplete="new-password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '14px 44px 14px 44px', background: 'rgba(10, 10, 10, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
                                }}
                                className="input-focus"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#666' }}
                                className="hover-text-white"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a0a0a0' }}>Confirmar Senha</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="#666" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirm-password"
                                autoComplete="new-password"
                                placeholder="Confirme sua senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '14px 44px 14px 44px', background: 'rgba(10, 10, 10, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
                                }}
                                className="input-focus"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#666' }}
                                className="hover-text-white"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        marginTop: '12px', padding: '14px', background: '#ffffff', color: '#000000', border: 'none', borderRadius: '8px',
                        fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1
                    }} className="btn-hover-opacity">
                        {loading ? 'Criando conta...' : <><UserPlus size={18} /> Cadastrar-se</>}
                    </button>

                </form>

                <div style={{ marginTop: '32px', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '24px' }}>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>
                        Já possui uma conta? <Link to="/login" style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">Entrar agora</Link>
                    </p>
                </div>

            </div>

            <style>{`
                .input-focus:focus { border-color: #07b6d5 !important; }
                .hover-opacity:hover { opacity: 0.8; }
                .hover-text-white:hover { color: #ffffff !important; }
                .btn-hover-opacity:hover:not(:disabled) { opacity: 0.9; }
                .hover-underline:hover { text-decoration: underline !important; }
                
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

export default RegisterPage
