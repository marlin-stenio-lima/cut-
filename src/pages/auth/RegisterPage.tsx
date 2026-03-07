import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, UserPlus, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../services/supabase'

const RegisterPage: React.FC = () => {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
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
            if (loading) {
                setLoading(false)
                setError('O cadastro está demorando mais que o esperado. Verifique sua conexão.')
            }
        }, 15000)

        try {
            console.log('[RegisterPage] Attempting signup for:', email)
            const { data, error: signupError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            })

            if (signupError) throw signupError

            if (data.user) {
                console.log('[RegisterPage] Signup success! Navigating to profile selection...')
                // Give a tiny bit of time for the Supabase trigger to finish creating the profile
                setTimeout(() => {
                    navigate('/profile-selection')
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
        <div className="auth-container">
            <div className="glass auth-card">
                <div className="auth-header">
                    <div className="logo-placeholder">
                        <span className="accent-cyan">Cut</span> House
                    </div>
                    <h2>Criar sua conta</h2>
                    <p>Junte-se à maior rede de editores de vídeo.</p>
                </div>

                <form onSubmit={handleRegister} className="auth-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="input-group">
                        <label><User size={18} /> Nome Completo</label>
                        <input
                            type="text"
                            name="name"
                            autoComplete="name"
                            placeholder="Seu Nome"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label><Mail size={18} /> E-mail</label>
                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label><Lock size={18} /> Senha</label>
                        <div className="password-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="new-password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <span className="helper-text">Mínimo de 6 caracteres</span>
                    </div>

                    <div className="input-group">
                        <label><Lock size={18} /> Confirmar Senha</label>
                        <div className="password-input-container">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirm-password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="glow-btn full-width indigo-glow" disabled={loading}>
                        {loading ? 'Criando...' : <><UserPlus size={20} /> Criar Minha Conta</>}
                    </button>
                </form>

                <p className="auth-footer">
                    Já tem uma conta? <Link to="/login" className="accent-cyan">Entre aqui</Link>
                </p>
            </div>
        </div>
    )
}

export default RegisterPage
