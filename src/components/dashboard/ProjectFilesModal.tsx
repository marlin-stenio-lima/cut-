import React, { useState } from 'react';
import { X, FileText, Play, Upload, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface ProjectFilesModalProps {
    project: {
        id: string;
        title: string;
        project_files?: { name: string; url: string; type?: string }[] | null;
        ryver_link?: string | null;
        editor_id?: string | null;
        is_proposal?: boolean;
    };
    userRole: 'client' | 'editor';
    userId: string;
    onClose: () => void;
    onRefresh: () => void;
    onPreviewVideo?: (file: any) => void;
}

const ProjectFilesModal: React.FC<ProjectFilesModalProps> = ({ project, userRole, userId, onClose, onRefresh, onPreviewVideo }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

    const handleDownload = async (url: string, fileName: string) => {
        try {
            setDownloadingFile(fileName);
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Error downloading file:', err);
            window.open(url, '_blank');
        } finally {
            setDownloadingFile(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError(null);

        try {
            const currentFiles = project.project_files || [];
            const newFiles = [...currentFiles];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (file.size > 500 * 1024 * 1024) {
                    setError(`O arquivo ${file.name} ultrapassa o limite de 500MB.`);
                    setUploading(false);
                    return;
                }

                const fileName = `${Date.now()}-${file.name}`;
                const { data: uploadData, error: uploadErr } = await supabase.storage
                    .from('project-files')
                    .upload(`${userId}/${fileName}`, file);

                if (uploadErr) throw uploadErr;

                if (uploadData) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('project-files')
                        .getPublicUrl(uploadData.path);

                    newFiles.push({
                        name: file.name,
                        url: publicUrl,
                        type: file.type,
                        path: uploadData.path // Using path for VideoModal compatibility
                    } as any);
                }
            }

            // Update project record
            const { error: updateError } = await supabase
                .from('projects')
                .update({ project_files: newFiles })
                .eq('id', project.id);

            if (updateError) throw updateError;

            onRefresh();
        } catch (err: any) {
            console.error('Error uploading file:', err);
            setError(`Erro ao enviar arquivo: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
            zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={onClose}>
            <div style={{
                maxWidth: '700px', width: '100%', borderRadius: '24px', padding: '32px',
                background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative',
                boxShadow: '0 30px 60px rgba(0,0,0,0.4)', animation: 'fadeIn 0.3s ease-out'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Central de Materiais</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{project.title}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Upload Area */}
                <div style={{
                    padding: '24px', borderRadius: '16px', background: 'rgba(7, 182, 213, 0.05)',
                    border: '2px dashed rgba(7, 182, 213, 0.2)', textAlign: 'center', position: 'relative'
                }}>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        disabled={uploading}
                    />
                    {uploading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <Loader2 className="animate-spin" size={32} color="var(--accent)" />
                            <p style={{ fontWeight: 600 }}>Enviando arquivos...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <Upload size={32} color="var(--accent)" style={{ opacity: 0.6 }} />
                            <p style={{ fontWeight: 600 }}>Clique ou arraste para enviar novos materiais</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Imagens, Vídeos, Roteiros (Máx 500MB)</p>
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#ef4444', fontSize: '0.85rem' }}>
                        {error}
                    </div>
                )}

                {/* File List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Arquivos do Projeto</h3>

                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '8px' }}>
                        {project.ryver_link && (
                            <div style={{ padding: '14px', background: 'rgba(7, 182, 213, 0.05)', borderRadius: '12px', border: '1px solid rgba(7, 182, 213, 0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ExternalLink size={18} color="var(--accent)" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>LINK EXTERNO</div>
                                    <a href={project.ryver_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}>{project.ryver_link}</a>
                                </div>
                            </div>
                        )}

                        {!project.project_files?.length && !project.ryver_link && (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Nenhum material enviado ainda.</p>
                        )}

                        {project.project_files?.map((file: any, idx: number) => {
                            const isAllowed = userRole === 'client' || (!project.is_proposal && project.editor_id === userId);
                            const isVideo = file.name.match(/\.(mp4|webm|ogg|mov)$/i);

                            return (
                                <div key={idx} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <FileText size={18} color="var(--accent)" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>{file.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Arquivo enviado</div>
                                    </div>

                                    {isVideo ? (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {isAllowed ? (
                                                <>
                                                    <button
                                                        className="btn-primary"
                                                        style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onPreviewVideo) {
                                                                onPreviewVideo(file);
                                                            }
                                                        }}
                                                    >
                                                        <Play size={12} fill="white" /> Assistir
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(file.url, file.name);
                                                        }}
                                                        disabled={downloadingFile === file.name}
                                                        style={{
                                                            padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px',
                                                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                                            borderRadius: '6px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600
                                                        }}
                                                    >
                                                        {downloadingFile === file.name ? <Loader2 size={12} className="animate-spin" /> : null}
                                                        Baixar
                                                    </button>
                                                </>
                                            ) : (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>Bloqueado</span>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(file.url, file.name);
                                            }}
                                            disabled={downloadingFile === file.name}
                                            style={{
                                                background: 'none', border: 'none', fontSize: '0.75rem',
                                                color: 'var(--accent)', cursor: 'pointer', fontWeight: 600,
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}
                                        >
                                            {downloadingFile === file.name ? <Loader2 size={12} className="animate-spin" /> : null}
                                            Baixar
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectFilesModal;
