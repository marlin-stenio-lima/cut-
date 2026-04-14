import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Phone, Paperclip, Send, CheckCheck, 
  Loader2, MessageSquare, Info, X, Mail, 
  User, Pause, Brain, Settings
} from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { supabase } from '../../services/supabase';

// --- EVOLUTION API INTEGRATION CONFIG ---
// TODO: Replace with actual Evolution API URL and Global API Key

// --- Types ---
export type MessageDirection = 'incoming' | 'outgoing';
export const MessageDirection = { INCOMING: 'incoming' as const, OUTGOING: 'outgoing' as const };

export type MessageType = 'text' | 'image' | 'audio';
export const MessageType = { TEXT: 'text' as const, IMAGE: 'image' as const, AUDIO: 'audio' as const };

export type ConversationStatus = 'human' | 'paused';

export interface UIMessage {
  id: string;
  content: string;
  timestamp: string;
  direction: MessageDirection;
  type: MessageType;
  status: 'sent' | 'delivered' | 'read';
  fromType: 'user' | 'human';
  mediaUrl: string | null;
}

export interface UIConversation {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactAvatar: string;
  contactEmail: string | null;
  status: ConversationStatus;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  tags: string[];
  messages: UIMessage[];
  clientMemory: any;
  notes: string | null;
  assignedUserId: string | null;
}

const AdminWhatsApp: React.FC = () => {
  const { showAlert } = useModal();

  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [showProfileInfo, setShowProfileInfo] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [evoUrl, setEvoUrl] = useState('');
  const [evoKey, setEvoKey] = useState('');
  const [evoInstance, setEvoInstance] = useState('');
  const loading = false; // Evolution sync loader mockup

  useEffect(() => {
    setEvoUrl(localStorage.getItem('evoUrl') || '');
    setEvoKey(localStorage.getItem('evoKey') || '');
    setEvoInstance(localStorage.getItem('evoInstance') || '');

    fetchMessages();

    const channel = supabase.channel('realtime-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
         fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return;

      const grouped = new Map<string, UIConversation>();
      data.forEach(msg => {
          const convId = msg.conversation_id;
          if (!convId) return;

          if (!grouped.has(convId)) {
              grouped.set(convId, {
                  id: convId,
                  contactId: convId,
                  contactName: convId.split('@')[0] || 'Desconhecido',
                  contactPhone: convId.split('@')[0] || '',
                  contactAvatar: `https://ui-avatars.com/api/?name=${convId.charAt(0) || 'U'}&background=0ea5e9&color=fff`,
                  contactEmail: null,
                  status: 'human',
                  lastMessage: '',
                  lastMessageTime: '',
                  unreadCount: 0,
                  tags: [],
                  messages: [],
                  clientMemory: {},
                  notes: null,
                  assignedUserId: null
              });
          }
          
          const conv = grouped.get(convId)!;
          conv.messages.push({
              id: msg.id || Math.random().toString(),
              content: msg.content || '',
              timestamp: new Date(msg.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
              direction: msg.direction === 'incoming' ? MessageDirection.INCOMING : MessageDirection.OUTGOING,
              type: msg.type || MessageType.TEXT,
              status: msg.status || 'delivered',
              fromType: msg.direction === 'incoming' ? 'user' : 'human',
              mediaUrl: msg.media_url || null
          });
          conv.lastMessage = msg.type === 'text' ? (msg.content || '') : `📷 Mídia`;
          conv.lastMessageTime = new Date(msg.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
      });

      const parsedConvs = Array.from(grouped.values()).reverse();
      setConversations(parsedConvs);
      if (parsedConvs.length > 0 && !selectedChatId) {
          setSelectedChatId(parsedConvs[0].id);
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens do Supabase:', err);
    }
  };

  const activeChat = conversations.find(c => c.id === selectedChatId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const markAsRead = (id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
  };

  useEffect(() => {
    if (selectedChatId && activeChat && activeChat.unreadCount > 0) markAsRead(selectedChatId);
  }, [selectedChatId, activeChat]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeChat) return;
    
    const content = inputText.trim();
    setInputText('');
    
    const newMessage: UIMessage = {
      id: `msg-${Date.now()}`,
      content,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      direction: MessageDirection.OUTGOING,
      type: MessageType.TEXT,
      status: 'sent',
      fromType: 'human',
      mediaUrl: null
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeChat.id) {
        return {
          ...c,
          messages: [...c.messages, newMessage],
          lastMessage: content,
          lastMessageTime: 'Agora'
        };
      }
      return c;
    }));
    
    // Optimistic Save to DB so user sees it persistently
    await supabase.from('messages').insert({
        conversation_id: activeChat.id,
        content: content,
        direction: 'outgoing',
        type: 'text',
        status: 'sent'
    });

    try {
      if (!evoUrl || !evoKey || !evoInstance) {
         showAlert('Erro', 'Configure a Evolution API na engrenagem (esq. superior) antes de tentar enviar testes reais.', 'error');
         return; // Interrompe se não há URL
      }

      // Padronizar número: Evolution espera DDI + DDD + Num (ex: 5511999999999)
      const cleanPhone = activeChat.contactPhone.replace(/\D/g, '');
      const baseUrl = evoUrl.endsWith('/') ? evoUrl.slice(0, -1) : evoUrl;

      // Executa o POST real para a Evolution API (Ex: Evolution V2 ou V1 -> /message/sendText/)
      const response = await fetch(`${baseUrl}/message/sendText/${evoInstance}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'apikey': evoKey 
        },
        body: JSON.stringify({ 
          number: cleanPhone, 
          text: content 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Erro desconhecido na Evolution');
      }

      console.log('Mensagem disparada com sucesso:', data);
    } catch (err: any) {
      console.error('Error Evolution', err);
      showAlert('Atenção', `Não foi possível conectar com a Evolution: ${err.message}. A interface foi atualizada visualmente (optimistic UI), mas verifique se a URL e a API Key estão corretas.`, 'error');
    }
  };

  const handleStatusChange = (status: ConversationStatus) => {
    if (!activeChat) return;
    setConversations(prev => prev.map(c => c.id === activeChat.id ? { ...c, status } : c));
  };

  const filteredConversations = conversations.filter(chat => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return chat.contactName.toLowerCase().includes(q) || chat.contactPhone.includes(q) || chat.lastMessage.toLowerCase().includes(q);
  });

  const renderStatusBadge = (status: ConversationStatus) => {
    const config = {
      human: { label: 'Humano', icon: User, bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
      paused: { label: 'Pausado', icon: Pause, bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' }
    };
    const { label, icon: Icon, bg, color, border } = config[status];
    return (
      <span style={{ background: bg, color: color, borderColor: border, display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, borderStyle: 'solid', borderWidth: '1px' }}>
        <Icon size={12} /> {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  // Define some color variables for inline use to preserve original glassmorphism
  const pBg = 'transparent';
  const pCard = 'rgba(255, 255, 255, 0.03)';
  const pBorder = 'rgba(255, 255, 255, 0.08)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', background: 'var(--bg-deep)' }}>
        
      {/* BANNER DE DESENVOLVIMENTO */}
      <div style={{ background: 'rgba(239, 68, 68, 0.15)', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#ef4444', fontWeight: 600, fontSize: '0.85rem', zIndex: 50 }}>
          <Settings size={16} className="animate-spin-slow" />
          Módulo de WhatsApp em Desenvolvimento. A conexão com o banco de dados e APIs está sendo finalizada.
      </div>

      <div style={{ display: 'flex', flex: 1, width: '100%', color: 'var(--text-main)', fontFamily: '"Inter", sans-serif', overflow: 'hidden' }}>
      
      {/* Sidebar Channels */}
      <div style={{ width: '340px', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${pBorder}`, background: pCard, flexShrink: 0 }}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${pBorder}` }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                Central WhatsApp
                <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 8px', borderRadius: '100px', fontWeight: 700, textTransform: 'uppercase' }}>Evolution API</span>
            </div>
          </h2>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" placeholder="Buscar ou inicie c/ número (ex: 55119...)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: `1px solid ${pBorder}`, borderRadius: '12px', padding: '12px 16px 12px 42px', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem' }} 
            />
            {searchQuery.match(/^\d{10,14}$/) && !conversations.find(c => c.contactPhone.replace(/\D/g, '') === searchQuery) && (
               <button onClick={() => {
                  const newChat: UIConversation = {
                    id: `conv-${Date.now()}`, contactId: `c-${Date.now()}`, contactName: `Novo Contato (${searchQuery})`, contactPhone: searchQuery,
                    contactAvatar: `https://ui-avatars.com/api/?name=New&background=333&color=fff`, contactEmail: null, status: 'human',
                    lastMessage: 'Nova janela iniciada p/ teste.', lastMessageTime: 'Agora', unreadCount: 0, tags: ['Teste'], messages: [], clientMemory: { lead_profile: { lead_stage: 'novo', interests: [] }, sales_intelligence: { pain_points: [], next_best_action: '-' }, interaction_summary: { total_conversations: 0 } }, notes: null, assignedUserId: null
                  };
                  setConversations([newChat, ...conversations]);
                  setSelectedChatId(newChat.id);
                  setSearchQuery('');
               }} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}>Novo DDI</button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {filteredConversations.map(chat => (
            <div 
              key={chat.id} onClick={() => setSelectedChatId(chat.id)}
              style={{ padding: '16px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '8px', 
                background: selectedChatId === chat.id ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                border: `1px solid ${selectedChatId === chat.id ? 'rgba(56, 189, 248, 0.3)' : 'transparent'}`,
                display: 'flex', alignItems: 'center', gap: '16px'
              }}
            >
              <div style={{ position: 'relative' }}>
                <img src={chat.contactAvatar} alt="Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                {chat.unreadCount > 0 && <span style={{ position: 'absolute', bottom: 0, right: 0, width: '14px', height: '14px', background: '#38bdf8', border: '2px solid var(--bg-deep)', borderRadius: '50%' }}></span>}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.contactName}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{chat.lastMessageTime}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>{chat.lastMessage}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {renderStatusBadge(chat.status)}
                  {chat.unreadCount > 0 && <span style={{ background: '#38bdf8', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '100px' }}>{chat.unreadCount}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeChat ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: pBg, position: 'relative' }}>
          
          {/* Header */}
          <div style={{ padding: '20px 32px', background: pCard, borderBottom: `1px solid ${pBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => setShowProfileInfo(!showProfileInfo)}>
              <img src={activeChat.contactAvatar} style={{ width: '44px', height: '44px', borderRadius: '50%' }} alt="" />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {activeChat.contactName} {renderStatusBadge(activeChat.status)}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{activeChat.contactPhone}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleStatusChange('human')} title="Em Atendimento" style={{ background: activeChat.status === 'human' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: activeChat.status === 'human' ? '#10b981' : 'var(--text-muted)', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><User size={20} /></button>
              <button onClick={() => handleStatusChange('paused')} title="Pausar" style={{ background: activeChat.status === 'paused' ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: activeChat.status === 'paused' ? '#f59e0b' : 'var(--text-muted)', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><Pause size={20} /></button>
              <div style={{ width: '1px', background: pBorder, margin: '0 8px' }}></div>
              <button onClick={() => setShowProfileInfo(!showProfileInfo)} style={{ background: showProfileInfo ? 'rgba(255,255,255,0.1)' : 'transparent', color: 'var(--text-main)', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><Info size={20} /></button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {activeChat.messages.map(msg => {
               const isOut = msg.direction === MessageDirection.OUTGOING;
               return (
                 <div key={msg.id} style={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start' }}>
                   <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isOut ? 'flex-end' : 'flex-start' }}>
                     <div style={{ 
                       padding: '16px 20px', borderRadius: '20px', fontSize: '0.95rem', lineHeight: '1.5',
                       background: isOut 
                         ? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                         : pCard,
                       color: isOut ? '#fff' : 'var(--text-main)',
                       border: isOut ? 'none' : `1px solid ${pBorder}`,
                       borderTopRightRadius: isOut ? '4px' : '20px',
                       borderTopLeftRadius: !isOut ? '4px' : '20px'
                     }}>
                       {msg.type === MessageType.IMAGE ? (
                         <img src={msg.mediaUrl || ''} alt="" style={{ maxWidth: '100%', borderRadius: '12px' }} />
                       ) : (
                         <span>{msg.content}</span>
                       )}
                     </div>
                     <div style={{ marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       {isOut && <User size={12} color="#0ea5e9" />}
                       {msg.timestamp}
                       {isOut && <CheckCheck size={14} color="#0ea5e9" />}
                     </div>
                   </div>
                 </div>
               )
             })}
             <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '24px 32px', background: pCard, borderTop: `1px solid ${pBorder}` }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '16px', alignItems: 'end' }}>
              <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '12px', cursor: 'pointer' }}><Paperclip size={20} /></button>
              <textarea 
                value={inputText} onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder={'Digite sua mensagem...'}
                style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: `1px solid ${pBorder}`, borderRadius: '16px', padding: '16px', color: 'var(--text-main)', outline: 'none', minHeight: '56px', resize: 'none' }}
              />
              <button type="submit" disabled={!inputText.trim()} style={{ background: inputText.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: inputText.trim() ? '#fff' : 'var(--text-muted)', border: 'none', padding: '16px', borderRadius: '16px', cursor: inputText.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h2>Selecione uma conversa para iniciar</h2>
          </div>
        </div>
      )}

      {/* CRM Profile Sidebar */}
      {activeChat && showProfileInfo && (
        <div style={{ width: '340px', background: pCard, borderLeft: `1px solid ${pBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '24px', borderBottom: `1px solid ${pBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 'bold' }}>Info do Lead</h3>
            <button onClick={() => setShowProfileInfo(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ textAlign: 'center' }}>
              <img src={activeChat.contactAvatar} style={{ width: '96px', height: '96px', borderRadius: '50%', margin: '0 auto 16px', border: '4px solid rgba(255,255,255,0.1)' }} alt="" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>{activeChat.contactName}</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{activeChat.clientMemory.lead_profile.lead_stage}</span>
            </div>

            <div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Contato</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Phone size={18} /></div>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Telefone</div><div style={{ fontSize: '0.9rem' }}>{activeChat.contactPhone}</div></div>
              </div>
              {activeChat.contactEmail && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Mail size={18} /></div>
                  <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Email</div><div style={{ fontSize: '0.9rem' }}>{activeChat.contactEmail}</div></div>
                </div>
              )}
            </div>

            <div style={{ height: '1px', background: pBorder }}></div>

            <div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={14} /> Inteligência SDR
              </h4>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '12px', border: `1px solid ${pBorder}` }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Interesses</div>
                <div style={{ fontSize: '0.85rem' }}>{activeChat.clientMemory.lead_profile.interests.join(', ') || 'Nenhum'}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: `1px solid ${pBorder}` }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Próxima Ação</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 'bold' }}>{activeChat.clientMemory.sales_intelligence.next_best_action}</div>
              </div>
            </div>
            
            <div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>Tags</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {activeChat.tags.map(tag => (
                   <span key={tag} style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '100px', fontSize: '0.75rem', border: `1px solid ${pBorder}` }}>{tag}</span>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminWhatsApp;
