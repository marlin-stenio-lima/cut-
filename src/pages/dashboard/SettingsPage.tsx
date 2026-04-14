import React, { useState, useEffect } from 'react';
import { Settings, QrCode, LogOut, CheckCircle, Smartphone, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useModal } from '../../context/ModalContext';

const SettingsPage: React.FC = () => {
    const { showAlert } = useModal();
    const [evoUrl, setEvoUrl] = useState('');
    const [evoKey, setEvoKey] = useState('');
    const [evoInstanceName, setEvoInstanceName] = useState('');
    const [evoNumber, setEvoNumber] = useState('');
    const [supabaseWebhookUrl, setSupabaseWebhookUrl] = useState('');
    
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState<'checking' | 'disconnected' | 'connected'>('checking');
    const [loadingAction, setLoadingAction] = useState(false);

    useEffect(() => {
        const _url = localStorage.getItem('evoUrl') || '';
        const _key = localStorage.getItem('evoKey') || '';
        const _instance = localStorage.getItem('evoInstance') || '';
        const _number = localStorage.getItem('evoNumber') || '';
        const _webhook = localStorage.getItem('evoWebhook') || '';
        setEvoUrl(_url);
        setEvoKey(_key);
        setEvoInstanceName(_instance);
        setEvoNumber(_number);
        setSupabaseWebhookUrl(_webhook);
        
        if (_url && _key && _instance) {
            checkConnection(_url, _key, _instance);
        } else {
            setStatus('disconnected');
        }
    }, []);

    const saveSettings = () => {
        let cleanUrl = evoUrl.trim();
        if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
        
        localStorage.setItem('evoUrl', cleanUrl);
        localStorage.setItem('evoKey', evoKey.trim());
        localStorage.setItem('evoInstance', evoInstanceName.trim());
        localStorage.setItem('evoNumber', evoNumber.replace(/\D/g, ''));
        localStorage.setItem('evoWebhook', supabaseWebhookUrl.trim());
        showAlert('Sucesso', 'Configurações globais de servidor salvas.', 'success');
        if (cleanUrl && evoKey.trim() && evoInstanceName.trim()) {
            checkConnection(cleanUrl, evoKey.trim(), evoInstanceName.trim());
        }
    };

    const checkConnection = async (url: string = evoUrl, key: string = evoKey, instance: string = evoInstanceName) => {
        if (!url || !key || !instance) {
            setStatus('disconnected');
            return;
        }
        setStatus('checking');
        try {
            // Verifica o estado da conexão da nossa instância reservada
            const req = await fetch(`${url}/instance/connectionState/${instance}`, {
                method: 'GET',
                headers: { 'apikey': key }
            });
            const data = await req.json();
            
            if (req.ok && data.instance) {
                if (data.instance.state === 'open') {
                    setStatus('connected');
                    setQrCode(null);
                } else {
                    setStatus('disconnected');
                }
            } else {
                setStatus('disconnected');
            }
        } catch (err) {
            console.error(err);
            setStatus('disconnected');
        }
    };

    const generateInstance = async () => {
        if (!evoUrl || !evoKey || !evoInstanceName) {
            showAlert('Atenção', 'Preencha a URL, a API Key e o Nome da Instância (ex: cut-crm) antes de conectar.', 'error');
            return;
        }
        setLoadingAction(true);
        setQrCode(null);
        try {
            // Tenta criar a instância e já pedir QR Code (Evolution v1 e v2)
            const payload: any = {
                instanceName: evoInstanceName.trim(),
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS'
            };
            if (evoNumber) {
                payload.number = evoNumber.replace(/\D/g, ''); // Evolution may require number formatting
            }

            const req = await fetch(`${evoUrl}/instance/create`, {
                method: 'POST',
                headers: { 'apikey': evoKey, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await req.json();
            
            // Se já existir ou der erro específico de fallback, forçamos o /connect
            if (!req.ok) {
                if (data.error && data.error.toLowerCase().includes('already')) {
                     // Instância existe, vamos pedir o QRCode via GET /instance/connect
                     const connectReq = await fetch(`${evoUrl}/instance/connect/${evoInstanceName}`, {
                         method: 'GET',
                         headers: { 'apikey': evoKey }
                     });
                     const connectData = await connectReq.json();
                     if (connectData.base64) {
                         setQrCode(connectData.base64);
                     } else {
                         showAlert('Acesso', 'Instância carregada mas não gerou QRCode. Verifique painel root.', 'success');
                     }
                } else {
                     throw new Error(data.error || data.message || 'Erro ao gerar ou comunicar com API.');
                }
            } else {
                // Sucesso direto no Create (v2 geralmente retorna o qrcode junto se qrcode: true)
                if (data.qrcode && data.qrcode.base64) {
                    setQrCode(data.qrcode.base64);
                } else if (data.hash && data.base64) {
                    setQrCode(data.base64);
                } else {
                     // Call connect just in case
                     const connectReq = await fetch(`${evoUrl}/instance/connect/${evoInstanceName}`, {
                         method: 'GET',
                         headers: { 'apikey': evoKey }
                     });
                     const connectData = await connectReq.json();
                     if (connectData.base64) setQrCode(connectData.base64);
                }
            }
            
        } catch (err: any) {
            console.error(err);
            showAlert('Erro', `Falha na geração da conexão: ${err.message}`, 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    const deleteInstance = async () => {
        setLoadingAction(true);
        try {
            await fetch(`${evoUrl}/instance/logout/${evoInstanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': evoKey }
            });
            await fetch(`${evoUrl}/instance/delete/${evoInstanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': evoKey }
            });
            setQrCode(null);
            setStatus('disconnected');
            showAlert('Desconectado', 'Sua instância do CRM foi removida/deslogada com sucesso.', 'success');
        } catch (err: any) {
             showAlert('Aviso', 'Erro desconhecido ao deslogar, verifique a Evolution.', 'error');
             setStatus('disconnected');
        } finally {
            setLoadingAction(false);
        }
    };

    const configureWebhook = async () => {
        if (!supabaseWebhookUrl) {
            showAlert('Atenção', 'Preencha a URL do Webhook do Supabase nas configurações à esquerda!', 'error');
            return;
        }
        setLoadingAction(true);
        try {
            const req = await fetch(`${evoUrl}/webhook/set/${evoInstanceName}`, {
                method: 'POST',
                headers: { 'apikey': evoKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    webhook: {
                        enabled: true,
                        url: supabaseWebhookUrl.trim(),
                        byEvents: false,
                        base64: true,
                        events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "MESSAGES_DELETE"]
                    }
                })
            });
            const data = await req.json();
            if (!req.ok) throw new Error(data.message || data.error || 'Erro ao configurar webhook');
            showAlert('Webhook Autoconfigurado!', 'A Evolution API agora está enviando eventos em tempo real para o seu Supabase Edge Function.', 'success');
        } catch (err: any) {
            console.error(err);
            showAlert('Erro', `Falha ao configurar Webhook: ${err.message}`, 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <div style={{ padding: '32px', minHeight: '80vh', display: 'flex', flexDirection: 'column', color: 'var(--text-main)', fontFamily: '"Inter", sans-serif' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 'bold' }}>Configurações Globais</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '48px', fontSize: '1rem' }}>
                Gerencie conexões do servidor e chaves centrais da aplicação.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) minmax(400px, 1fr)', gap: '32px' }}>
                
                {/* Evolution Setup Container */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '14px', borderRadius: '18px' }}>
                            <Settings size={28} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Evolution API (Host)</h3>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Configuração de rede e tokens globais.</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>URL da API (com http/https)</label>
                            <input 
                                type="password" value={evoUrl} onChange={e => setEvoUrl(e.target.value)} 
                                placeholder="ex: https://evo.meudominio.com" 
                                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Global API Key</label>
                            <input 
                                type="password" value={evoKey} onChange={e => setEvoKey(e.target.value)} 
                                placeholder="Sua apikey configurada no servidor" 
                                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} 
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nome da Instância</label>
                                <input 
                                    value={evoInstanceName} onChange={e => setEvoInstanceName(e.target.value)} 
                                    placeholder="Ex: zap-admin" 
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Número (Opcional)</label>
                                <input 
                                    value={evoNumber} onChange={e => setEvoNumber(e.target.value)} 
                                    placeholder="Ex: 551199999999" 
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} 
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>URL do Webhook Supabase</label>
                            <input 
                                type="password" value={supabaseWebhookUrl} onChange={e => setSupabaseWebhookUrl(e.target.value)} 
                                placeholder="ex: https://xxx.supabase.co/functions/v1/webhook-whatsapp" 
                                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: '14px', padding: '16px', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} 
                            />
                        </div>
                        <button 
                            onClick={saveSettings} 
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', padding: '16px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', marginTop: '8px', fontSize: '1rem' }}
                        >
                            Salvar Credenciais
                        </button>
                    </div>
                </div>

                {/* Instance Management Container */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '14px', borderRadius: '18px' }}>
                                <Smartphone size={28} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Conexão WhatsApp</h3>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Instância: <span style={{ color: '#fff', fontWeight: 'bold' }}>{evoInstanceName || 'Não definida'}</span></div>
                            </div>
                        </div>
                        <button onClick={() => checkConnection()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', cursor: 'pointer', padding: '10px', borderRadius: '12px' }} title="Atualizar Status">
                             <RefreshCw size={20} className={status === 'checking' ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '24px' }}>
                        {status === 'checking' ? (
                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                                <Loader2 size={40} className="animate-spin" color="#38bdf8" />
                                <span>Verificando conexão...</span>
                             </div>
                        ) : status === 'connected' ? (
                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#10b981', textAlign: 'center' }}>
                                <CheckCircle size={64} style={{ filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.4))' }} />
                                <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>WhatsApp Conectado!</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>A API está pronta para disparos nativos e leitura através do painel.</span>
                                
                                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                    <button onClick={configureWebhook} disabled={loadingAction} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        <RefreshCw size={18} className={loadingAction ? "animate-spin" : ""} /> Configurar Webhook Automático
                                    </button>
                                    <button onClick={deleteInstance} disabled={loadingAction} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        <LogOut size={18} /> Deslogar
                                    </button>
                                </div>
                             </div>
                        ) : (
                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', textAlign: 'center' }}>
                                {!qrCode ? (
                                    <>
                                        <AlertCircle size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                                        <span style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '16px' }}>Nenhum aparelho conectado.</span>
                                        
                                        <button onClick={generateInstance} disabled={loadingAction} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#10b981', color: '#fff', border: 'none', padding: '18px', borderRadius: '16px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)' }}>
                                            {loadingAction ? <Loader2 size={24} className="animate-spin" /> : <QrCode size={24} />}
                                            Gerar Nova Conexão
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h4 style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#10b981' }}>Escaneie para logar</h4>
                                        <div style={{ padding: '16px', background: '#fff', borderRadius: '24px', marginTop: '12px', boxShadow: '0 8px 32px rgba(16,185,129,0.2)' }}>
                                             <img src={qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`} alt="WhatsApp QR Code" style={{ width: '220px', height: '220px' }} />
                                        </div>
                                        <button onClick={() => checkConnection()} style={{ marginTop: '24px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                             <CheckCircle size={18} /> Validar QRCode (Já Escaneei)
                                        </button>
                                    </>
                                )}
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
