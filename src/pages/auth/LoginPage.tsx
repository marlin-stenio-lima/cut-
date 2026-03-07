import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../services/supabase'

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const timeout = setTimeout(() => {
            setLoading(false)
            setError('A requisição de login falhou ou demorou demais. Tente novamente.')
        }, 10000)

        try {
            console.log('[LoginPage] Attempting login for:', email)
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) throw authError

            if (data.user) {
                console.log('[LoginPage] Auth success! Waiting for AuthContext to redirect...')
                // No need to navigate manually, AuthProvider + App routing should handle it.
                // But we wait a bit to see if we navigate automatically.
                setTimeout(() => {
                    navigate('/dashboard')
                }, 500)
            }
        } catch (error: any) {
            console.error('[LoginPage] Login error:', error.message)
            setError(error.message === 'Invalid login credentials'
                ? 'E-mail ou senha incorretos.'
                : 'Erro ao entrar: ' + error.message)
            setLoading(false)
        } finally {
            clearTimeout(timeout)
            // Note: We don't always set loading false here because if successful, 
            // we want to stay in loading state until navigation occurs.
        }
    }

    return (
        <div className="auth-container">
            <div className="glass auth-card">
                <div className="auth-header">
                    <div className="logo-placeholder">
                        <span className="accent-cyan">Cut</span> House
                    </div>
                    <h2>Bem-vindo de volta!</h2>
                    <p>Entre para gerenciar seus projetos de vídeo.</p>
                </div>

                <form onSubmit={handleLogin} className="auth-form">
                    {error && <div className="error-message">{error}</div>}

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
                                name="password"
                                autoComplete="current-password"
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
                    </div>

                    <div className="auth-actions">
                        <Link to="/forgot-password">Esqueci minha senha</Link>
                    </div>

                    <button type="submit" className="glow-btn full-width" disabled={loading}>
                        {loading ? 'Entrando...' : <><LogIn size={20} /> Entrar</>}
                    </button>
                </form>

                <p className="auth-footer">
                    Não tem uma conta? <Link to="/register" className="accent-cyan">Criar uma conta</Link>
                </p>
            </div>
        </div>
    )
}

export default LoginPage
