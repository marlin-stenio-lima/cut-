import React from 'react'
import { Link } from 'react-router-dom'
import { Clapperboard, Star, ArrowRight, CheckCircle, Zap, Shield, Play } from 'lucide-react'

const LandingPage: React.FC = () => {
    return (
        <div className="landing-container" style={{ backgroundColor: 'var(--bg-deep)', overflowX: 'hidden', minHeight: '100vh', color: 'var(--text-main)' }}>
            {/* Navigation */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 80px',
                background: 'rgba(11, 11, 17, 0.8)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    <Clapperboard className="accent-cyan" size={24} />
                    <span>Cut House</span>
                </div>

                <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                    <a href="#explorar" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.8 }}>Explorar</a>
                    <a href="#editores" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.8 }}>Para Editores</a>
                    <a href="#empresas" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.8 }}>Para Empresas</a>
                    <a href="#precos" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.8 }}>Preços</a>
                </div>

                <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                    <Link to="/login" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>Entrar</Link>
                    <Link to="/register" className="glow-btn" style={{
                        padding: '12px 28px',
                        fontSize: '0.95rem',
                        borderRadius: '100px',
                        background: 'var(--accent)',
                        boxShadow: '0 0 20px rgba(7, 182, 213, 0.3)'
                    }}>Começar Agora</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                paddingTop: '220px',
                paddingBottom: '160px',
                textAlign: 'center',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '800px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
                    filter: 'blur(100px)',
                    zIndex: -1
                }}></div>

                <div className="container" style={{ maxWidth: '1000px', padding: '0 24px', zIndex: 10 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 20px',
                        borderRadius: '100px',
                        border: '1px solid rgba(7, 182, 213, 0.3)',
                        background: 'rgba(7, 182, 213, 0.05)',
                        marginBottom: '40px'
                    }}>
                        <span style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>ELITE VIDEO EDITING NETWORK</span>
                    </div>

                    <h1 style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '32px', letterSpacing: '-0.04em', fontWeight: 700 }}>
                        Conectando os <span style={{ background: 'linear-gradient(to right, #07b6d5, #6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Melhores</span> <br />
                        <span style={{ background: 'linear-gradient(to right, #6366F1, #07b6d5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Editores</span> de Vídeo aos Seus <br />
                        Projetos
                    </h1>

                    <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '780px', margin: '0 auto 56px', lineHeight: 1.6 }}>
                        A plataforma premium onde talentos da edição encontram os projetos mais ambiciosos do mercado. Qualidade, agilidade e segurança em um só lugar.
                    </p>

                    <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
                        <Link to="/register" style={{
                            background: 'var(--accent)',
                            color: '#000',
                            padding: '18px 48px',
                            borderRadius: '8px',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            Encontrar Editor <ArrowRight size={20} />
                        </Link>
                        <button className="glass" style={{
                            padding: '18px 48px',
                            color: 'white',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            Sou Editor
                        </button>
                    </div>
                </div>

                {/* Floating Components Layout */}
                <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, pointerEvents: 'none' }}>
                    {/* Status Card (Left) */}
                    <div className="glass" style={{
                        position: 'absolute',
                        left: '12%',
                        top: '55%',
                        width: '240px',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        textAlign: 'left',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        animation: 'float 6s ease-in-out infinite'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(7, 182, 213, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle size={18} className="accent-cyan" />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>STATUS</span>
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px', lineHeight: 1.4 }}>
                            Projeto Finalizado: <br /> Cinematic Showreel
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ width: '100%', height: '100%', background: 'var(--accent)' }}></div>
                        </div>
                    </div>

                    {/* Top Editors Card (Right) */}
                    <div className="glass" style={{
                        position: 'absolute',
                        right: '12%',
                        top: '40%',
                        width: '260px',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        animation: 'float 7s ease-in-out infinite reverse'
                    }}>
                        <div style={{ display: 'flex', gap: '-12px', marginBottom: '16px', justifyContent: 'center' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--bg-deep)', background: '#2D2D35', overflow: 'hidden' }}></div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--bg-deep)', background: '#3D3D45', marginLeft: '-15px', overflow: 'hidden' }}></div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--bg-deep)', background: 'var(--accent)', marginLeft: '-15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>+1.2k</div>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', marginBottom: '12px' }}>
                            Top Editores Disponíveis
                        </div>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="#FFD700" color="#FFD700" />)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Cut House Section */}
            <section style={{ padding: '100px 80px', background: '#0B0B11' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'left', marginBottom: '64px' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.02em' }}>Por que o Cut House?</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', lineHeight: 1.5 }}>
                            Uma curadoria exclusiva de profissionais e projetos de alto nível com ferramentas de gestão integradas.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
                        {/* Card 1 */}
                        <div className="glass" style={{ padding: '40px', borderRadius: '16px', transition: 'all 0.3s', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'rgba(7, 182, 213, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '24px'
                            }}>
                                <CheckCircle size={24} className="accent-cyan" />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px' }}>Talentos Elite</h3>
                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Apenas os 5% melhores editores passam em nosso rigoroso teste de qualidade e portfólio.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="glass" style={{ padding: '40px', borderRadius: '16px', transition: 'all 0.3s', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '24px'
                            }}>
                                <Zap size={24} style={{ color: 'var(--primary)' }} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px' }}>Fluxo Ágil</h3>
                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Gestão de projetos simplificada com ferramentas intuitivas de feedback e controle de versão.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="glass" style={{ padding: '40px', borderRadius: '16px', transition: 'all 0.3s', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'rgba(34, 197, 94, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '24px'
                            }}>
                                <Shield size={24} style={{ color: '#22c55e' }} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px' }}>Pagamentos Seguros</h3>
                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Garantia de recebimento e proteção total com sistema de escrow integrado para cada etapa.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '100px 80px', marginBottom: '100px' }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    borderRadius: '32px',
                    background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent), radial-gradient(circle at bottom left, rgba(7, 182, 213, 0.15), transparent), rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '100px 40px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <h2 style={{ fontSize: '4rem', fontWeight: 700, marginBottom: '24px', letterSpacing: '-0.02em' }}>
                        Pronto para elevar o nível das suas produções?
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto 48px', lineHeight: 1.6 }}>
                        Junte-se à comunidade que está transformando o mercado de vídeo digital no Brasil e no mundo.
                    </p>
                    <Link to="/register" style={{
                        background: 'var(--accent)',
                        color: '#000',
                        padding: '20px 60px',
                        borderRadius: '100px',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-block',
                        boxShadow: '0 0 40px rgba(7, 182, 213, 0.4)',
                        transition: 'all 0.3s'
                    }}>
                        Criar Conta Gratuita
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '80px 80px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0B0B11' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.4rem', fontWeight: 700, marginBottom: '16px' }}>
                            <Clapperboard className="accent-cyan" size={24} />
                            <span>Cut House</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>© 2026 Cut House. Elevando o nível do seu conteúdo.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '48px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Plataforma</span>
                            <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>Explorar</a>
                            <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>Planos</a>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Legal</span>
                            <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>Privacidade</a>
                            <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>Termos</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Floating Card Animations */}
            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
        </div>
    )
}

export default LandingPage
