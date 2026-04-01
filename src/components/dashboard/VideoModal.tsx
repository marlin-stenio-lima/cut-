import React from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface VideoModalProps {
    file: {
        name: string;
        path: string;
        url?: string;
        type?: string;
    };
    status?: string; // Optional: To hide/show watermark
    onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ file, onClose }) => {
    const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const getUrl = async () => {
            // Priority: URL already provided > Storage Path
            if (file.url) {
                setVideoUrl(file.url);
                setLoading(false);
                return;
            }

            const { data } = supabase.storage
                .from('project-files')
                .getPublicUrl(file.path);

            if (data) {
                setVideoUrl(data.publicUrl);
            }
            setLoading(false);
        };

        getUrl();
    }, [file]);

    const isFinished = status === 'Concluído';

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(10px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }} onClick={onClose}>
            <div style={{
                maxWidth: '1000px',
                width: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 600 }}>{file.name}</h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{
                    background: '#000',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    aspectRatio: '16/9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {loading ? (
                        <div style={{ color: 'var(--accent)' }}>Carregando vídeo...</div>
                    ) : videoUrl ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <video
                                src={videoUrl}
                                controls
                                controlsList={isFinished ? "" : "nodownload"}
                                onContextMenu={(e) => !isFinished && e.preventDefault()}
                                autoPlay
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                            
                            {!isFinished && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pointerEvents: 'none', // Allows clicking through to the video controls
                                    userSelect: 'none',
                                    zIndex: 10
                                }}>
                                    <div style={{
                                        fontSize: '4rem',
                                        fontWeight: 900,
                                        color: 'rgba(255, 255, 255, 0.1)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.2em',
                                        transform: 'rotate(-30deg)',
                                        whiteSpace: 'nowrap',
                                        textAlign: 'center'
                                    }}>
                                        CUT HOUSE<br/>PREVIEW
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '20px',
                                        right: '20px',
                                        background: 'rgba(0,0,0,0.5)',
                                        padding: '4px 12px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        color: 'rgba(255,255,255,0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        🔒 Protegido pela Cut House
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ color: '#ef4444' }}>Erro ao carregar vídeo.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoModal;
