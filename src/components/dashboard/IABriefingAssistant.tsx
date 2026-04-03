import React, { useState } from 'react';
import { X, Bot, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, DollarSign, Clock, Layout } from 'lucide-react';

interface IABriefingAssistantProps {
    onComplete: (data: any) => void;
    onClose: () => void;
}

const QUESTIONS = [
  {
    id: 'goal',
    question: "Qual o objetivo principal do seu vídeo?",
    options: [
      { label: 'Reels / TikTok (Viral)', value: 'reels', desc: 'Edição dinâmica, legendas e cortes rápidos.', basePrice: 80 },
      { label: 'YouTube (Conteúdo)', value: 'youtube', desc: 'Narrativa estruturada, B-rolls e transições.', basePrice: 150 },
      { label: 'Anúncio / VSL (Venda)', value: 'ads', desc: 'Foco total em conversão e retenção.', basePrice: 250 }
    ]
  },
  {
    id: 'duration',
    question: "Qual a duração estimada do vídeo final?",
    options: [
      { label: 'Até 1 Minuto', value: '1min', multiplier: 1 },
      { label: '3 a 5 Minutos', value: '5min', multiplier: 2.5 },
      { label: '10 Minutos+', value: '10min+', multiplier: 5 }
    ]
  },
  {
      id: 'complexity',
      question: "Qual o nível de edição desejado?",
      options: [
        { label: 'Básica / Clean', value: 'clean', desc: 'Cortes limpos e ajuste de áudio.', multiplier: 1 },
        { label: 'Dinâmica / Efeitos', value: 'dynamic', desc: 'Zooms, Sound Design e Motion.', multiplier: 1.5 },
        { label: 'Ultra Premium / IA', value: 'premium', desc: 'Tratamento de cor e animações complexas.', multiplier: 2.2 }
      ]
  }
];

const IABriefingAssistant: React.FC<IABriefingAssistantProps> = ({ onComplete, onClose }) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<any>({});
    
    const handleSelect = (id: string, value: any) => {
        const newAnswers = { ...answers, [id]: value };
        setAnswers(newAnswers);
        
        if (step < QUESTIONS.length - 1) {
            setStep(step + 1);
        }
    };

    const calculateSuggestion = () => {
        const goal = QUESTIONS[0].options.find(o => o.value === answers.goal);
        const duration = QUESTIONS[1].options.find(o => o.value === answers.duration);
        const complexity = QUESTIONS[2].options.find(o => o.value === answers.complexity);
        
        if (!goal || !duration || !complexity) return 200;

        const base = goal.basePrice || 100;
        const durMult = duration.multiplier || 1;
        const compMult = complexity.multiplier || 1;
        
        return Math.round(base * durMult * compMult);
    };

    const finish = () => {
        const suggestedPrice = calculateSuggestion();
        const descriptionSnippet = `
            Objetivo: ${QUESTIONS[0].options.find(o => o.value === answers.goal)?.label}
            Duração: ${QUESTIONS[1].options.find(o => o.value === answers.duration)?.label}
            Estilo: ${QUESTIONS[2].options.find(o => o.value === answers.complexity)?.label}
            Necessidades: Edição profissional focada em ${answers.goal === 'reels' ? 'retenção e viralização' : 'clareza e autoridade'}.
        `.trim();

        onComplete({
            videoType: answers.goal,
            description: descriptionSnippet,
            style: answers.complexity,
            budget: suggestedPrice.toString()
        });
    };

    const currentQ = QUESTIONS[step];

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, padding: '20px' }} onClick={onClose}>
            <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '32px', position: 'relative', border: '1px solid var(--glass-border)', background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
                
                <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary)' }}>
                        <Bot size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Assistente Inteligente</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Vou te ajudar a montar o briefing perfeito em segundos.</p>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                        {QUESTIONS.map((_, i) => (
                            <div key={i} style={{ height: '4px', flex: 1, borderRadius: '4px', background: i <= step ? 'var(--primary)' : 'rgba(255,255,255,0.05)', transition: 'all 0.3s' }} />
                        ))}
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>{currentQ.question}</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {currentQ.options.map((opt: any) => (
                            <button 
                                key={opt.value}
                                onClick={() => handleSelect(currentQ.id, opt.value)}
                                style={{
                                    padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)',
                                    background: answers[currentQ.id] === opt.value ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                                    color: 'var(--text-main)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{opt.label}</div>
                                    {opt.desc && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{opt.desc}</div>}
                                </div>
                                <ArrowRight size={18} style={{ opacity: 0.3 }} />
                            </button>
                        ))}
                    </div>
                </div>

                {step === QUESTIONS.length - 1 && answers[currentQ.id] && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ padding: '20px', borderRadius: '20px', background: 'rgba(7, 182, 213, 0.05)', border: '1px solid rgba(7,182,213,0.1)', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem' }}>
                                <Sparkles size={16} /> Sugestão da IA
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Orçamento Recomendado:</span>
                                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)' }}>R$ {calculateSuggestion()}</span>
                            </div>
                        </div>
                        <button onClick={finish} className="glow-btn" style={{ width: '100%', padding: '16px', borderRadius: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                             Aplicar Sugestões <CheckCircle2 size={20} />
                        </button>
                    </div>
                )}
                
                {step > 0 && (
                    <button onClick={() => setStep(step - 1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowLeft size={14} /> Voltar pergunta
                    </button>
                )}
            </div>
        </div>
    );
};

export default IABriefingAssistant;
