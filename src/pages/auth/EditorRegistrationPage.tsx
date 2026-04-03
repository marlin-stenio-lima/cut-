import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    User, Eye, EyeOff, 
    ChevronRight, ChevronLeft, Upload, Check, 
    Loader2, Video, Trash2, Plus, X, Briefcase 
} from 'lucide-react';
import Logo from '../../components/common/Logo';
import { supabase } from '../../services/supabase';

const EditorRegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        // Auth
        fullName: '',
        email: '',
        phone: '',
        password: '',
        // Details
        age: '',
        location: '',
        editingExperience: '',
        softwareSkills: [] as string[],
        videoFormats: [] as string[],
        portfolioLinks: '',
        deadlineHandling: '',
        weeklyAvailability: '',
        priceExpectation: '',
        clientTypes: '',
        additionalSkills: [] as string[],
        managedProfiles: '',
        motivation: '',
        multipleProjectsHandling: '',
        willingToTest: false,
        additionalComments: '',
        idFile: null as File | null,
        faceFile: null as File | null,
        portfolioFiles: [] as File[]
    });

    const softOptions = ['Premiere Pro', 'After Effects', 'Final Cut', 'CapCut', 'DaVinci Resolve', 'Sony Vegas', 'Photoshop', 'Canva'];
    const formatOptions = ['Shorts/Reels/TikTok', 'YouTube Longo', 'Institucional', 'Vlogs', 'Podcasts', 'Anúncios/Ads', 'Documentários'];
    const skillsOptions = ['Estratégia', 'Redação', 'Análise', 'Design', 'Edição de Vídeos', 'Motion Graphics', 'Copywriting'];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (name: 'softwareSkills' | 'videoFormats' | 'additionalSkills', value: string) => {
        setFormData(prev => {
            const current = [...prev[name]];
            if (current.includes(value)) {
                return { ...prev, [name]: current.filter(i => i !== value) };
            } else {
                return { ...prev, [name]: [...current, value] };
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'idFile' | 'faceFile') => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, [field]: e.target.files![0] }));
        }
    };

    const handlePortfolioFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setFormData(prev => ({ 
                ...prev, 
                portfolioFiles: [...prev.portfolioFiles, ...filesArray].slice(0, 5) // Limit to 5
            }));
        }
    };

    const removePortfolioFile = (index: number) => {
        setFormData(prev => ({
            ...prev,
            portfolioFiles: prev.portfolioFiles.filter((_, i) => i !== index)
        }));
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('[handleSubmit] Starting registration process...');
            
            // 1. Auth/User Check
            let userId = '';
            
            // Check if user is already logged in
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session?.user) {
                console.log('[handleSubmit] User already logged in:', sessionData.session.user.id);
                userId = sessionData.session.user.id;
            } else {
                console.log('[handleSubmit] Creating new auth user...');
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                            phone: formData.phone,
                        }
                    }
                });

                if (authError) {
                    if (authError.message === 'User already registered') {
                        throw new Error('User already registered');
                    }
                    throw authError;
                }
                if (!authData.user) throw new Error('Falha ao criar usuário.');
                userId = authData.user.id;
            }

            console.log('[handleSubmit] Target UserId:', userId);

            // 2. Parallel File Uploads
            console.log('[handleSubmit] Starting parallel uploads...');
            const uploadPromises = [];

            // ID File
            if (formData.idFile) {
                const file = formData.idFile;
                const fileExt = file.name.split('.').pop();
                const fileName = `${userId}-id.${fileExt}`;
                uploadPromises.push(
                    supabase.storage
                        .from('editor-identity')
                        .upload(`${userId}/${fileName}`, file, { upsert: true })
                        .then(({ data, error }) => {
                            if (error) throw new Error(`Erro no upload da Identidade: ${error.message}`);
                            return { type: 'identity', path: data?.path };
                        })
                );
            }

            // Face File
            if (formData.faceFile) {
                const file = formData.faceFile;
                const fileExt = file.name.split('.').pop();
                const fileName = `${userId}-face.${fileExt}`;
                uploadPromises.push(
                    supabase.storage
                        .from('editor-face')
                        .upload(`${userId}/${fileName}`, file, { upsert: true })
                        .then(({ data, error }) => {
                            if (error) throw new Error(`Erro no upload da Foto do Rosto: ${error.message}`);
                            return { type: 'face', path: data?.path };
                        })
                );
            }

            // Portfolio Videos
            formData.portfolioFiles.forEach((file, i) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${userId}-portfolio-${i}.${fileExt}`;
                uploadPromises.push(
                    supabase.storage
                        .from('editor-portfolio')
                        .upload(`${userId}/${fileName}`, file, { upsert: true })
                        .then(({ data, error }) => {
                            if (error) throw new Error(`Erro no upload do vídeo ${i+1}: ${error.message}`);
                            return { type: 'portfolio', path: data?.path };
                        })
                );
            });

            const uploadResults = await Promise.all(uploadPromises);
            console.log('[handleSubmit] All uploads completed.');

            let identityUrl = uploadResults.find(r => r.type === 'identity')?.path || '';
            let faceUrl = uploadResults.find(r => r.type === 'face')?.path || '';
            const portfolioVideoUrls = uploadResults.filter(r => r.type === 'portfolio').map(r => r.path);

            const allPortfolioLinks = [
                ...(formData.portfolioLinks ? [formData.portfolioLinks] : []),
                ...portfolioVideoUrls
            ];

            // 3. Update Profile
            console.log('[handleSubmit] Updating profile details...');
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    role: 'editor',
                    age: parseInt(formData.age) || null,
                    location: formData.location,
                    contact_email: formData.email,
                    whatsapp: formData.phone,
                    editing_experience: formData.editingExperience,
                    software_skills: formData.softwareSkills,
                    video_formats: formData.videoFormats,
                    portfolio_links: allPortfolioLinks,
                    deadline_handling: formData.deadlineHandling,
                    weekly_availability: formData.weeklyAvailability,
                    price_expectation: formData.priceExpectation,
                    client_types: formData.clientTypes,
                    additional_skills: formData.additionalSkills,
                    managed_profiles: [formData.managedProfiles],
                    motivation: formData.motivation,
                    multiple_projects_handling: formData.multipleProjectsHandling,
                    unique_value: formData.uniqueValue,
                    additional_comments: formData.additionalComments,
                    identity_doc_url: identityUrl,
                    face_photo_url: faceUrl,
                    onboarding_status: 'pending',
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (profileError) throw profileError;
            console.log('[handleSubmit] Profile updated successfully!');

            // 4. Redirect
            navigate('/register/thanks');

        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.message === 'User already registered') {
                setError(
                    <span>
                        Este e-mail já está cadastrado. <Link to="/login" style={{ color: '#07b6d5', textDecoration: 'underline' }}>Faça login aqui</Link> ou use outro e-mail.
                    </span>
                );
            } else {
                setError(err.message || 'Ocorreu um erro ao processar sua candidatura.');
            }
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 14px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        marginBottom: '4px'
    };

    const labelStyle = {
        fontSize: '0.85rem',
        fontWeight: 600 as const,
        color: '#a0a0a0',
        marginBottom: '6px',
        display: 'block'
    };

    return (
        <div className="futuristic-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontFamily: "'Inter', sans-serif", padding: '40px 20px' }}>
            
            <div style={{ width: '100%', maxWidth: '600px', background: 'rgba(5, 5, 5, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                
                {/* Progress Bar */}
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', width: '100%' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg, #07b6d5 0%, #8b5cf6 100%)', width: `${(step / 5) * 100}%`, transition: 'width 0.3s ease' }} />
                </div>

                <div style={{ padding: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                        <Logo />
                    </div>

                    <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
                            {step === 1 && "Crie sua conta de Editor"}
                            {step === 2 && "Sua Experiência"}
                            {step === 3 && "Especialização"}
                            {step === 4 && "Logística e Valores"}
                            {step === 5 && "Documentação"}
                        </h2>
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>Passo {step} de 5</p>
                    </div>

                    <form onSubmit={(e) => e.preventDefault()}>
                        
                        {error && (
                            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem', marginBottom: '24px' }}>
                                {error}
                            </div>
                        )}

                        {/* STEP 1: ACCOUNT */}
                        {step === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={labelStyle}>Nome Completo *</label>
                                    <input name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Ex: João Silva" style={inputStyle} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>E-mail corporativo ou pessoal *</label>
                                    <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="exemplo@email.com" style={inputStyle} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>WhatsApp / Telefone *</label>
                                    <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="(00) 00000-0000" style={inputStyle} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>Senha *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            name="password" 
                                            type={showPassword ? "text" : "password"} 
                                            value={formData.password} 
                                            onChange={handleInputChange} 
                                            placeholder="Mínimo 6 caracteres" 
                                            style={inputStyle} 
                                            required 
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: EXPERIENCE */}
                        {step === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>Idade *</label>
                                        <input name="age" type="number" value={formData.age} onChange={handleInputChange} placeholder="Ex: 25" style={inputStyle} required />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Cidade/Estado *</label>
                                        <input name="location" value={formData.location} onChange={handleInputChange} placeholder="São Paulo, SP" style={inputStyle} required />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Há quanto tempo você edita vídeos? *</label>
                                    <input name="editingExperience" value={formData.editingExperience} onChange={handleInputChange} placeholder="Ex: 2 anos" style={inputStyle} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>Quais softwares você domina? *</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginTop: '8px' }}>
                                        {softOptions.map(opt => (
                                            <button 
                                                key={opt}
                                                type="button"
                                                onClick={() => handleCheckboxChange('softwareSkills', opt)}
                                                style={{
                                                    padding: '8px 12px', textAlign: 'left', borderRadius: '8px', fontSize: '0.85rem',
                                                    background: formData.softwareSkills.includes(opt) ? 'rgba(7, 182, 213, 0.2)' : 'rgba(255,255,255,0.03)',
                                                    border: `1px solid ${formData.softwareSkills.includes(opt) ? '#07b6d5' : 'rgba(255,255,255,0.1)'}`,
                                                    color: formData.softwareSkills.includes(opt) ? '#fff' : '#aaa',
                                                    transition: 'all 0.2s', cursor: 'pointer'
                                                }}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: SPECIALIZATION */}
                        {step === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={labelStyle}>Você edita quais formatos de vídeo? *</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', marginTop: '8px' }}>
                                        {formatOptions.map(opt => (
                                            <button 
                                                key={opt}
                                                type="button"
                                                onClick={() => handleCheckboxChange('videoFormats', opt)}
                                                style={{
                                                    padding: '8px 12px', textAlign: 'left', borderRadius: '8px', fontSize: '0.85rem',
                                                    background: formData.videoFormats.includes(opt) ? 'rgba(7, 182, 213, 0.2)' : 'rgba(255,255,255,0.03)',
                                                    border: `1px solid ${formData.videoFormats.includes(opt) ? '#07b6d5' : 'rgba(255,255,255,0.1)'}`,
                                                    color: formData.videoFormats.includes(opt) ? '#fff' : '#aaa',
                                                    transition: 'all 0.2s', cursor: 'pointer'
                                                }}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Tipos de clientes atendidos</label>
                                    <input name="clientTypes" value={formData.clientTypes} onChange={handleInputChange} placeholder="Ex: Infoprodutores, Empresas..." style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Outras Habilidades</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                        {skillsOptions.map(opt => (
                                            <button 
                                                key={opt}
                                                type="button"
                                                onClick={() => handleCheckboxChange('additionalSkills', opt)}
                                                style={{
                                                    padding: '6px 12px', borderRadius: '100px', fontSize: '0.8rem',
                                                    background: formData.additionalSkills.includes(opt) ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                                                    border: `1px solid ${formData.additionalSkills.includes(opt) ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                                                    color: formData.additionalSkills.includes(opt) ? '#fff' : '#aaa',
                                                    transition: 'all 0.2s', cursor: 'pointer'
                                                }}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: PORTFOLIO & LOGISTICS */}
                        {step === 4 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Briefcase size={18} color="#07b6d5" /> Portfólio de Trabalho *
                                    </h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={labelStyle}>Links Externos (Behance, YouTube, Drive...)</label>
                                            <input name="portfolioLinks" value={formData.portfolioLinks} onChange={handleInputChange} placeholder="https://..." style={inputStyle} />
                                        </div>

                                        <div style={{ textAlign: 'center', padding: '12px', color: '#666', fontSize: '0.8rem' }}>— OU —</div>

                                        <div>
                                            <label style={labelStyle}>Subir Vídeos (No mínimo 3 vídeos obrigatórios) *</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
                                                {formData.portfolioFiles.map((file, index) => (
                                                    <div key={index} style={{ position: 'relative', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(7, 182, 213, 0.3)' }}>
                                                        <Video size={24} color="#07b6d5" />
                                                        <button onClick={() => removePortfolioFile(index)} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '18px', height: '18px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {formData.portfolioFiles.length < 5 && (
                                                    <label style={{ height: '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s' }} className="hover-border-primary">
                                                        <input type="file" accept="video/*" multiple onChange={handlePortfolioFilesChange} style={{ display: 'none' }} />
                                                        <Plus size={24} color="#666" />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>Disponibilidade semanal *</label>
                                        <input name="weeklyAvailability" value={formData.weeklyAvailability} onChange={handleInputChange} placeholder="Ex: 20h/semana" style={inputStyle} required />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Pretensão de valor *</label>
                                        <input name="priceExpectation" value={formData.priceExpectation} onChange={handleInputChange} placeholder="Por vídeo ou pacote" style={inputStyle} required />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>O que te motiva a trabalhar com a gente? *</label>
                                    <textarea name="motivation" value={formData.motivation} onChange={handleInputChange} style={{ ...inputStyle, minHeight: '80px', resize: 'none' }} required />
                                </div>
                            </div>
                        )}

                        {/* STEP 5: DOCUMENTATION */}
                        {step === 5 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {/* ID FILE */}
                                    <div style={{ 
                                        padding: '40px 24px', textAlign: 'center', 
                                        background: 'rgba(7, 182, 213, 0.03)', 
                                        border: '2px dashed rgba(7, 182, 213, 0.2)', 
                                        borderRadius: '16px', position: 'relative' 
                                    }}>
                                        <input 
                                            type="file" 
                                            accept="image/*,application/pdf" 
                                            onChange={(e) => handleFileChange(e, 'idFile')}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                        />
                                        {formData.idFile ? (
                                            <div style={{ color: '#22c55e', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                {formData.idFile.type.startsWith('image/') ? (
                                                    <img 
                                                        src={URL.createObjectURL(formData.idFile)} 
                                                        alt="Preview" 
                                                        style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} 
                                                    />
                                                ) : <Check size={32} />}
                                                <p style={{ fontWeight: 600, fontSize: '0.8rem' }}>Identidade OK</p>
                                            </div>
                                        ) : (
                                            <div style={{ color: '#07b6d5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                <Upload size={32} />
                                                <p style={{ fontWeight: 600, fontSize: '0.8rem' }}>Identidade (RG/CNH)</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* FACE FILE */}
                                    <div style={{ 
                                        padding: '40px 24px', textAlign: 'center', 
                                        background: 'rgba(139, 92, 246, 0.03)', 
                                        border: '2px dashed rgba(139, 92, 246, 0.2)', 
                                        borderRadius: '16px', position: 'relative' 
                                    }}>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={(e) => handleFileChange(e, 'faceFile')}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                        />
                                        {formData.faceFile ? (
                                            <div style={{ color: '#22c55e', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                <img 
                                                    src={URL.createObjectURL(formData.faceFile)} 
                                                    alt="Preview" 
                                                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} 
                                                />
                                                <p style={{ fontWeight: 600, fontSize: '0.8rem' }}>Foto do Rosto OK</p>
                                            </div>
                                        ) : (
                                            <div style={{ color: '#8b5cf6', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                <User size={32} />
                                                <p style={{ fontWeight: 600, fontSize: '0.8rem' }}>Foto do Rosto (Selfie)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255, 193, 7, 0.05)', border: '1px solid rgba(255, 193, 7, 0.1)', padding: '16px', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.85rem', color: '#ffb300', lineHeight: 1.5 }}>
                                        <strong>Privacidade:</strong> Seus dados e documentos são protegidos por criptografia e serão utilizados exclusivamente para a análise de verificação interna.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
                            {step > 1 && (
                                <button type="button" onClick={prevStep} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <ChevronLeft size={18} /> Anterior
                                </button>
                            )}
                            {step < 5 ? (
                                <button type="button" onClick={nextStep} 
                                    disabled={step === 4 && formData.portfolioFiles.length < 3}
                                    style={{ 
                                        flex: 2, padding: '14px', borderRadius: '12px', background: '#fff', color: '#000', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        opacity: (step === 4 && formData.portfolioFiles.length < 3) ? 0.3 : 1
                                    }}>
                                    Próximo Passo <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button type="button" onClick={handleSubmit} disabled={loading || !formData.idFile || !formData.faceFile} style={{ flex: 2, padding: '14px', borderRadius: '12px', background: 'linear-gradient(90deg, #07b6d5 0%, #8b5cf6 100%)', color: '#fff', border: 'none', fontWeight: 800, cursor: (loading || !formData.idFile || !formData.faceFile) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (loading || !formData.idFile || !formData.faceFile) ? 0.7 : 1 }}>
                                    {loading ? (
                                        <>Finalizando... <Loader2 className="animate-spin" size={20} /></>
                                    ) : (
                                        <>Enviar Candidatura <Check size={20} /></>
                                    )}
                                </button>
                            )}
                        </div>

                    </form>
                </div>
            </div>

            <style>{`
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
    );
};

export default EditorRegistrationPage;
