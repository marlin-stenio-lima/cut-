import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, UserPlus } from 'lucide-react'
import { supabase } from '../../services/supabase'

const RegisterPage: React.FC = () => {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
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

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            // After signup, redirect to profile selection
            navigate('/profile-selection')
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
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label><Lock size={18} /> Senha</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label><Lock size={18} /> Confirmar Senha</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
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
