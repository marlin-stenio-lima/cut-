import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Video, PenTool, Calendar, DollarSign, Loader2 } from 'lucide-react';
import StepProgress from '../../../components/dashboard/StepProgress';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';

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
    ryverLink: string;
    files: any[];
}

const NewProjectPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [data, setData] = useState<ProjectData>({
        title: '',
        videoType: '',
        format: '',
        description: '',
        style: '',
        references: '',
        budget: '',
        deadline: '',
        ryverLink: '',
        files: []
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
        if (!user) {
            setError('Você precisa estar logado para criar um projeto.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const { error: insertDataError } = await supabase
                .from('projects')
                .insert([{
                    client_id: user.id,
                    title: data.title,
                    video_type: data.videoType,
                    format: data.format,
                    description: data.description,
                    style: data.style,
                    references_url: data.references,
                    budget: parseFloat(data.budget) || null,
                    deadline: data.deadline || null,
                    ryver_link: data.ryverLink,
                    project_files: data.files,
                    status: 'Aberto'
                }]);

            if (insertDataError) throw insertDataError;

            // Sucesso!
            navigate('/dashboard/projects', { state: { projectCreated: true } });
        } catch (err: any) {
            console.error('Erro ao criar projeto:', err);
            setError(err.message || 'Erro ao criar projeto. Tente novamente.');
            setIsSubmitting(false);
        }
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
                            <div className="grid-responsive-2" style={{ gap: '15px' }}>
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
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 600 }}>Link do Google Drive / Ryver (Opcional)</label>
                                <input
                                    type="url"
                                    className="auth-input"
                                    placeholder="https://drive.google.com/... ou https://ryver.com/..."
                                    value={data.ryverLink}
                                    onChange={(e) => setData({ ...data, ryverLink: e.target.value })}
                                />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                    Cole o link da pasta ou arquivos se eles forem muito pesados.
                                </span>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 600 }}>Upload de Arquivos (Imagens, Roteiros, etc.)</label>
                                <div style={{
                                    border: '2px dashed var(--glass-border)',
                                    borderRadius: '12px',
                                    padding: '32px',
                                    textAlign: 'center',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    cursor: uploading ? 'wait' : 'pointer',
                                    opacity: uploading ? 0.7 : 1,
                                    position: 'relative'
                                }} onClick={() => !uploading && document.getElementById('file-upload')?.click()}>
                                    {uploading ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <Loader2 className="animate-spin" size={32} color="var(--accent)" />
                                            <p style={{ color: 'var(--text-main)', fontWeight: 600 }}>Fazendo upload dos arquivos...</p>
                                        </div>
                                    ) : uploadError ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', maxWidth: '80%' }}>
                                                <p style={{ fontWeight: 600, marginBottom: '4px' }}>Erro no Upload</p>
                                                <p style={{ fontSize: '0.85rem' }}>{uploadError}</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setUploadError(null); }}
                                                style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', marginTop: '8px' }}
                                            >
                                                Tentar Novamente
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Video size={32} color="var(--accent)" style={{ opacity: 0.5, marginBottom: '12px' }} />
                                            <p style={{ color: 'var(--text-main)', fontWeight: 600 }}>Clique para selecionar arquivos</p>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Arquivos do seu computador (Máx 500MB por projeto)</p>
                                            <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--accent)', background: 'rgba(7, 182, 213, 0.1)', padding: '6px 12px', borderRadius: '8px', display: 'inline-block' }}>
                                                Dica: Para arquivos maiores que 500MB, use o campo de Link acima.
                                            </div>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        id="file-upload"
                                        multiple
                                        disabled={uploading}
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const files = e.target.files;
                                            if (!files || !user || files.length === 0) return;

                                            setUploading(true);
                                            setUploadError(null);
                                            try {
                                                const newFiles = [...data.files];
                                                for (let i = 0; i < files.length; i++) {
                                                    const file = files[i];

                                                    // Optional: checking for 500MB limit per file on client side too
                                                    if (file.size > 500 * 1024 * 1024) {
                                                        setUploadError(`O arquivo ${file.name} ultrapassa o limite de 500MB.`);
                                                        setUploading(false);
                                                        return;
                                                    }

                                                    const fileName = `${Date.now()}-${file.name}`;
                                                    const { data: uploadData, error: uploadErr } = await supabase.storage
                                                        .from('project-files')
                                                        .upload(`${user.id}/${fileName}`, file, {
                                                            cacheControl: '3600',
                                                            upsert: false
                                                        });

                                                    if (uploadErr) {
                                                        console.error(`Error uploading ${file.name}:`, uploadErr);
                                                        setUploadError(uploadErr.message === 'Bucket not found'
                                                            ? 'O repositório "project-files" não foi encontrado no seu Supabase Storage. Crie o Bucket primeiro!'
                                                            : `Erro ao subir ${file.name}: ${uploadErr.message}`);
                                                        setUploading(false);
                                                        return;
                                                    }

                                                    if (uploadData) {
                                                        newFiles.push({
                                                            name: file.name,
                                                            path: uploadData.path,
                                                            size: file.size,
                                                            type: file.type
                                                        });
                                                    }
                                                }
                                                setData(prev => ({ ...prev, files: newFiles }));
                                            } catch (err) {
                                                console.error('Upload process error:', err);
                                                alert('Ocorreu um erro inesperado no upload.');
                                            } finally {
                                                setUploading(false);
                                                // Clear the input so same file can be selected again if needed
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </div>
                                {data.files.length > 0 && (
                                    <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {data.files.map((f, idx) => (
                                            <div key={idx} style={{
                                                padding: '8px 12px',
                                                background: 'rgba(7, 182, 213, 0.1)',
                                                borderRadius: '8px',
                                                fontSize: '0.8rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                color: 'var(--text-main)',
                                                border: '1px solid var(--glass-border)'
                                            }}>
                                                <PenTool size={14} /> {f.name}
                                                <button
                                                    onClick={() => setData(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }))}
                                                    style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '0 4px', fontSize: '1.2rem', lineHeight: 1 }}
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid-responsive-2" style={{ gap: '15px' }}>
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
                            <div className="grid-responsive-2" style={{ gap: '15px' }}>
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
                        {error && (
                            <div className="error-message" style={{ marginTop: '20px' }}>
                                {error}
                            </div>
                        )}
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
                            disabled={currentStep === 2 && !data.ryverLink.trim() && data.files.length === 0}
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                opacity: (currentStep === 2 && !data.ryverLink.trim() && data.files.length === 0) ? 0.5 : 1,
                                cursor: (currentStep === 2 && !data.ryverLink.trim() && data.files.length === 0) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Próximo <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                backgroundColor: isSubmitting ? 'transparent' : 'var(--accent)',
                                boxShadow: isSubmitting ? 'none' : '0 0 20px var(--accent-glow)',
                                border: isSubmitting ? '1px solid var(--accent)' : 'none',
                                opacity: isSubmitting ? 0.7 : 1
                            }}
                        >
                            {isSubmitting ? (
                                <>Processando <Loader2 className="animate-spin" size={18} /></>
                            ) : (
                                <>Publicar Projeto <Check size={18} /></>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewProjectPage;
