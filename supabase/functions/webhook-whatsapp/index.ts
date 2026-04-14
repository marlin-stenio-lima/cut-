import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configurações do Supabase (as chaves de ambiente padrão da Edge Function)
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // CORS Headers se necessário, mas webhook geralmente não precisa.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const payload = await req.json();

    // Filtra apenas o evento de recebimento e envio (upsert)
    if (payload.event === 'messages.upsert') {
      const msg = payload.data.message;
      const remoteJid = msg.key.remoteJid;       // Ex: 5511999999999@s.whatsapp.net
      const fromMe = msg.key.fromMe;              // Boolean (true se foi enviado pelo admin/api, false se veio do cliente)
      const messageId = msg.key.id;

      let content = '';
      let type = 'text';
      let mediaUrl = null;

      // Extract Content & Type based on Baileys/Evolution API structure
      if (msg.message?.conversation) {
        content = msg.message.conversation;
      } else if (msg.message?.extendedTextMessage?.text) {
        content = msg.message.extendedTextMessage.text;
      } else if (msg.message?.imageMessage) {
        type = 'image';
        content = msg.message.imageMessage.caption || '📷 Imagem';
        
        // Verifica se a Evolution API mandou a imagem em Base64
        if (payload.data.base64) {
           // Decodifica e sobe pro Storage do Supabase (Exemplo)
           const base64Data = payload.data.base64.replace(/^data:image\/\w+;base64,/, "");
           const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
           const fileName = `whatsapp/${Date.now()}-${messageId}.jpeg`;

           const { data: uploadData, error: uploadError } = await supabase.storage
              .from('media') // <- Você precisará ter um bucket chamado "media" no Storage do Supabase
              .upload(fileName, buffer, { contentType: 'image/jpeg' });

           if (!uploadError && uploadData) {
               const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(uploadData.path);
               mediaUrl = publicUrlData.publicUrl;
           }
        }
      } else if (msg.message?.audioMessage) {
        type = 'audio';
        content = '🎵 Áudio';
        if (payload.data.base64) {
           const base64Data = payload.data.base64.replace(/^data:audio\/\w+;(.*)?base64,/, "");
           const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
           const fileName = `whatsapp/${Date.now()}-${messageId}.ogg`;

           const { data: uploadData, error: uploadError } = await supabase.storage
              .from('media')
              .upload(fileName, buffer, { contentType: 'audio/ogg' });

           if (!uploadError && uploadData) {
               const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(uploadData.path);
               mediaUrl = publicUrlData.publicUrl;
           }
        }
      }

      // Preparando objeto para inserção
      const insertData = {
        conversation_id: remoteJid,
        content: content,
        direction: fromMe ? 'outgoing' : 'incoming',
        type: type,
        media_url: mediaUrl,
        status: fromMe ? 'sent' : 'delivered'
      };

      // Grava no banco!
      const { error } = await supabase.from('messages').insert(insertData);

      if (error) {
        console.error('Erro ao inserir no BD', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }

      return new Response(JSON.stringify({ success: true, message: 'Message logged' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });

    }

    return new Response("Not a message event", { status: 200 });

  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 400 });
  }
})
