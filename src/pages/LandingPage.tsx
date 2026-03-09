import { Link } from 'react-router-dom'
import { ArrowRight, Check, ShieldCheck, Users, MessageSquare } from 'lucide-react'
import Logo from '../components/common/Logo'

// Array of fake trusted companies
const TRUSTED_BY = ['Nexus', 'Vanguard', 'OmniTech', 'Stratos', 'Quantum', 'Horizon']

const LandingPage: React.FC = () => {
    return (
        <div className="futuristic-bg" style={{ color: '#ffffff', minHeight: '100vh', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

            {/* Header */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                zIndex: 100,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 5%',
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                <Logo />

                <nav className="desktop-nav" style={{ gap: '32px' }}>
                    <a href="#como-funciona" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }} className="nav-link">Como funciona</a>
                    <a href="#produtores" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }} className="nav-link">Para editores</a>
                    <a href="#empresas" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }} className="nav-link">Para empresas</a>
                </nav>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Link to="/login" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Entrar</Link>
                    <Link to="/register" style={{
                        padding: '10px 20px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        background: '#ffffff',
                        color: '#000000',
                        textDecoration: 'none',
                        transition: 'transform 0.2s'
                    }} className="btn-hover-scale">Criar Conta</Link>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{
                paddingTop: '160px',
                paddingBottom: '80px',
                paddingLeft: '5%',
                paddingRight: '5%',
                textAlign: 'center',
                maxWidth: '1000px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '6px 16px',
                    borderRadius: '100px',
                    border: '1px solid rgba(7, 182, 213, 0.3)',
                    background: 'rgba(7, 182, 213, 0.1)',
                    marginBottom: '32px'
                }}>
                    <span style={{ color: '#07b6d5', fontSize: '0.8rem', fontWeight: 600 }}>Plataforma Premium de Edição de Vídeo</span>
                </div>

                <h1 style={{
                    fontSize: 'clamp(3rem, 6vw, 5rem)',
                    lineHeight: 1.1,
                    marginBottom: '24px',
                    letterSpacing: '-0.03em',
                    fontWeight: 800,
                    color: '#ffffff'
                }}>
                    A comunidade de editores de vídeo ao seu alcance.
                </h1>

                <p style={{
                    fontSize: '1.25rem',
                    color: '#a0a0a0',
                    maxWidth: '680px',
                    margin: '0 auto 48px',
                    lineHeight: 1.6
                }}>
                    Contrate profissionais e produtoras de vídeo de um jeito simples, rápido e seguro. Para todo tipo de projeto e orçamento.
                </p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/register" style={{
                        background: '#07b6d5',
                        color: '#000000',
                        padding: '16px 32px',
                        borderRadius: '6px',
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }} className="btn-hover-solid">
                        Encontrar Editores <ArrowRight size={18} />
                    </Link>
                    <Link to="/register" style={{
                        padding: '16px 32px',
                        color: '#ffffff',
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        borderRadius: '6px',
                        border: '1px solid #333333',
                        background: '#111111',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }} className="btn-hover-outline">
                        Sou Editor
                    </Link>
                </div>
            </section>

            {/* Trusted By Strip */}
            <section style={{ padding: '40px 5%', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', background: '#050505' }}>
                <p style={{ textAlign: 'center', color: '#666666', fontSize: '0.85rem', fontWeight: 500, marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    A ESCOLHA DE EQUIPES DE MARKETING DE ALTA PERFORMANCE
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 6vw, 64px)', flexWrap: 'wrap', opacity: 0.5 }}>
                    {TRUSTED_BY.map((company, index) => (
                        <div key={index} style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                            {company}
                        </div>
                    ))}
                </div>
            </section>

            {/* How it Works / Value Prop */}
            <section id="como-funciona" style={{ padding: '120px 5%', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em' }}>
                        Tudo em um só lugar.<br />Da ideia ao download final.
                    </h2>
                    <p style={{ color: '#a0a0a0', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
                        Sua experiência simplificada para contratar produtores de vídeo de forma profissional, segura e sem atrito.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>

                    {/* Feature 1 */}
                    <div style={{ padding: '32px', background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#111111', border: '1px solid #222', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <Users size={24} color="#07b6d5" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Encontre o talento ideal</h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
                            {[
                                'Receba orçamentos gratuitamente',
                                'Conexão inteligente com especialistas',
                                '1 briefing, várias propostas comerciais'
                            ].map((item, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#888888', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                    <Check size={16} color="#07b6d5" style={{ flexShrink: 0, marginTop: '4px' }} />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Feature 2 */}
                    <div style={{ padding: '32px', background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#111111', border: '1px solid #222', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <ShieldCheck size={24} color="#07b6d5" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Garantia de entrega e segurança</h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
                            {[
                                'Pague sem riscos pelos projetos',
                                'Libere o pagamento apenas na conclusão',
                                'Profissionais selecionados rigorosamente'
                            ].map((item, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#888888', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                    <Check size={16} color="#07b6d5" style={{ flexShrink: 0, marginTop: '4px' }} />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Feature 3 */}
                    <div style={{ padding: '32px', background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#111111', border: '1px solid #222', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <MessageSquare size={24} color="#07b6d5" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Gestão simplificada</h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
                            {[
                                'Briefings e projetos no mesmo lugar',
                                'Ferramenta de feedback simplificada',
                                'Controle de versões e alterações'
                            ].map((item, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#888888', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                    <Check size={16} color="#07b6d5" style={{ flexShrink: 0, marginTop: '4px' }} />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </section>

            {/* Testimonial / Social Proof */}
            <section style={{ padding: '100px 5%', background: '#050505', borderTop: '1px solid #111111', borderBottom: '1px solid #111111' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ marginBottom: '32px', color: '#07b6d5' }}>
                        ★★★★★
                    </div>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 500, lineHeight: 1.4, marginBottom: '40px', letterSpacing: '-0.01em' }}>
                        "A CutHouse é uma excelente plataforma de conexão. Simples de usar e com uma rede de parceiros diversificada. Já são incontáveis vídeos produzidos e todos realizados de forma incrivelmente eficiente e com qualidade altíssima."
                    </h2>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Ana Carolina Soares</div>
                        <div style={{ color: '#888888', fontSize: '0.9rem' }}>Diretora de Marketing • TechGrowth</div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section style={{ padding: '120px 5%', textAlign: 'center' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.03em' }}>
                        Pronto para produzir?
                    </h2>
                    <p style={{ color: '#a0a0a0', fontSize: '1.1rem', marginBottom: '40px', lineHeight: 1.6 }}>
                        Junte-se a centenas de empresas que já otimizaram sua produção audiovisual com a nossa rede qualificada.
                    </p>
                    <Link to="/register" style={{
                        background: '#ffffff',
                        color: '#000000',
                        padding: '18px 40px',
                        borderRadius: '6px',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'transform 0.2s'
                    }} className="btn-hover-scale">
                        Criar Projeto Grátis
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '60px 5% 40px', borderTop: '1px solid #1a1a1a', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px' }}>

                        <div style={{ maxWidth: '300px' }}>
                            <Logo size="sm" />
                            <p style={{ color: '#666666', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                A plataforma que conecta você a editores profissionais, garantindo segurança e fluidez do briefing à entrega.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 'clamp(40px, 8vw, 100px)', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>Produto</span>
                                <Link to="/register" style={{ color: '#888888', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} className="footer-link">Buscar Editores</Link>
                                <Link to="/register" style={{ color: '#888888', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} className="footer-link">Sou Editor</Link>
                                <a href="#" style={{ color: '#888888', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} className="footer-link">Preços</a>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>Empresa</span>
                                <a href="#" style={{ color: '#888888', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} className="footer-link">Sobre</a>
                                <a href="#" style={{ color: '#888888', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} className="footer-link">Privacidade</a>
                                <a href="#" style={{ color: '#888888', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} className="footer-link">Termos de Uso</a>
                            </div>
                        </div>

                    </div>

                    <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <span style={{ color: '#666666', fontSize: '0.85rem' }}>© 2026 CutHouse. Todos os direitos reservados.</span>
                    </div>

                </div>
            </footer>

            {/* Injected Styles for Hover Effects since we removed index.css heavy dependencies */}
            <style>{`
                .nav-link:hover { color: #ffffff !important; }
                .footer-link:hover { color: #ffffff !important; }
                .btn-hover-scale:hover { transform: scale(1.02); }
                .btn-hover-solid:hover { background: #06a4c0 !important; }
                .btn-hover-outline:hover { background: #1a1a1a !important; border-color: #444 !important; }
                .logo-container:hover { opacity: 0.8; }
                ::selection { background: rgba(7, 182, 213, 0.3); color: white; }
                
                .desktop-nav { display: none; }
                @media (min-width: 768px) {
                    .desktop-nav { display: flex; }
                }
                
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

export default LandingPage
