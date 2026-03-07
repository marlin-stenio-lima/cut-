import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Video, PenTool, Calendar, DollarSign } from 'lucide-react';
import StepProgress from '../../../components/dashboard/StepProgress';

const STEPS = ['Detalhes', 'Criatividades', 'Execução', 'Resumo'];

interface ProjectData {
    title: string;
    videoType: string;
    format: string;
    description: string;
    style: string;
    references: string;
    budget: string;
    deadline: string;
}

const NewProjectPage: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<ProjectData>({
        title: '',
        videoType: '',
        format: '',
        description: '',
        style: '',
        references: '',
        budget: '',
        deadline: '',
    });

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        console.log('Final Submission:', data);
        // Simulate loading
        alert('Projeto enviado com sucesso!');
        navigate('/dashboard/projects');
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="step-content">
                        <h3 style={{ color: 'var(--text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Video size={20} color="var(--accent)" /> Detalhes do Projeto
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Título do Projeto</label>
                                <input
                                    type="text"
                                    className="auth-input"
                                    placeholder="Ex: Edição de Vídeo para Curso de Marketing"
                                    value={data.title}
                                    onChange={(e) => setData({ ...data, title: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tipo de Vídeo</label>
                                    <select
                                        className="auth-input"
                                        style={{ backgroundColor: 'var(--bg-card)' }}
                                        value={data.videoType}
                                        onChange={(e) => setData({ ...data, videoType: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="reels">Reels / TikTok (Vertical)</option>
                                        <option value="youtube">Vídeo para YouTube</option>
                                        <option value="ads">Anúncio / VSL</option>
                                        <option value="institutional">Institucional</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Formato</label>
                                    <select
                                        className="auth-input"
                                        style={{ backgroundColor: 'var(--bg-card)' }}
                                        value={data.format}
                                        onChange={(e) => setData({ ...data, format: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="9x16">9:16 (Vertical)</option>
                                        <option value="16x9">16:9 (Horizontal)</option>
                                        <option value="1x1">1:1 (Quadrado)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="step-content">
                        <h3 style={{ color: 'var(--text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <PenTool size={20} color="var(--accent)" /> Criatividade e Briefing
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Descrição Breve / Roteiro</label>
                                <textarea
                                    className="auth-input"
                                    style={{ minHeight: '100px', padding: '15px' }}
                                    placeholder="Explique o que você espera do resultado final..."
                                    value={data.description}
                                    onChange={(e) => setData({ ...data, description: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Estilo de Edição</label>
                                <select
                                    className="auth-input"
                                    style={{ backgroundColor: 'var(--bg-card)' }}
                                    value={data.style}
                                    onChange={(e) => setData({ ...data, style: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="dynamic">Dinâmico (Cortes rápidos, zooms)</option>
                                    <option value="clean">Minimalista (Sóbrio, elegância)</option>
                                    <option value="kinetic">Cinético (Foco em tipografia)</option>
                                    <option value="vlog">Estilo Vlog (Natural)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Links de Referência (Opcional)</label>
                                <input
                                    type="text"
                                    className="auth-input"
                                    placeholder="Ex: https://youtube.com/exemplo"
                                    value={data.references}
                                    onChange={(e) => setData({ ...data, references: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="step-content">
                        <h3 style={{ color: 'var(--text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Calendar size={20} color="var(--accent)" /> Prazos e Orçamento
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Prazo Desejado</label>
                                    <input
                                        type="date"
                                        className="auth-input"
                                        value={data.deadline}
                                        onChange={(e) => setData({ ...data, deadline: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Budget Máximo (R$)</label>
                                    <div style={{ position: 'relative' }}>
                                        <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                                        <input
                                            type="number"
                                            className="auth-input"
                                            style={{ paddingLeft: '35px' }}
                                            placeholder="Ex: 500"
                                            value={data.budget}
                                            onChange={(e) => setData({ ...data, budget: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="step-content">
                        <h3 style={{ color: 'var(--text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Check size={20} color="var(--accent)" /> Revisão Final
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: 'var(--text-muted)' }}>
                            <div className="summary-item" style={{ padding: '15px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '5px' }}>Título:</strong>
                                {data.title || 'Não informado'}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="summary-item" style={{ padding: '15px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '5px' }}>Tipo:</strong>
                                    {data.videoType || 'Não selecionado'}
                                </div>
                                <div className="summary-item" style={{ padding: '15px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                                    <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '5px' }}>Prazo:</strong>
                                    {data.deadline || 'Não definido'}
                                </div>
                            </div>
                            <div className="summary-item" style={{ padding: '15px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '5px' }}>Orçamento:</strong>
                                R$ {data.budget || '0,00'}
                            </div>
                        </div>
                        <p style={{ marginTop: '20px', fontSize: '0.85rem', textAlign: 'center' }}>
                            Ao confirmar, o projeto será listado para os melhores editores do Cut House.
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
            <div className="glass" style={{ padding: '40px', position: 'relative' }}>
                <StepProgress steps={STEPS} currentStep={currentStep} />

                {renderStep()}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '30px' }}>
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', opacity: currentStep === 0 ? 0.3 : 1 }}
                    >
                        <ArrowLeft size={18} /> Voltar
                    </button>

                    {currentStep < STEPS.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                        >
                            Próximo <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'var(--accent)', boxShadow: '0 0 20px var(--accent-glow)' }}
                        >
                            Publicar Projeto <Check size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewProjectPage;
