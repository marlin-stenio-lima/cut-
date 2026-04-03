const { createClient } = require('@supabase/supabase-js');
const url = 'https://bxhymspdioxddhacxvrt.supabase.co';
const key = '';
const supabase = createClient(url, key);

async function audit() {
  const email = 'cliente@gmail.com';
  console.log('--- AUDITORIA: ' + email + ' ---');
  
  try {
    const { data: authUser } = await supabase.from('profiles').select('id, balance, full_name').eq('full_name', 'cliente').maybeSingle();
    // Wait, let's search by email in auth if possible, or just search profile.
    // The screenshot says 'cliente@gmail.com' at the bottom left.
    
    // Let's search all profiles to find the one with that email (if email is in profiles) 
    // or just search by 'cliente' name.
    const { data: profiles } = await supabase.from('profiles').select('*');
    const profile = profiles.find(p => p.full_name?.toLowerCase().includes('cliente') || p.email?.toLowerCase() === email);
    
    if (!profile) {
       console.log('PERFIL_NAO_ENCONTRADO');
       // Try to list all profiles to see which one it is
       console.log('PROFILES_LIST:' + JSON.stringify(profiles));
       return;
    }

    const userId = profile.id;
    const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('user_id', userId);
    const { data: projects } = await supabase.from('projects').select('*').eq('client_id', userId);

    console.log('ID: ' + userId);
    console.log('SALDO_ATUAL: ' + profile.balance);
    console.log('TRANSACOES: ' + JSON.stringify(txs, null, 2));
    console.log('PROJETOS: ' + JSON.stringify(projects, null, 2));

  } catch (e) {
    console.error('ERRO: ' + e.message);
  }
}
audit();
