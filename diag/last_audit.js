const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bxhymspdioxddhacxvrt.supabase.co', '');

async function audit() {
  try {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', '798d7112-c8b5-4a9e-b655-be882ab399f3').single();
    const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('user_id', '798d7112-c8b5-4a9e-b655-be882ab399f3');
    
    console.log('--- AUDITORIA FINAL ---');
    console.log('ID: ' + profile.id);
    console.log('BALANCE: ' + profile.balance);
    console.log('TXS: ' + JSON.stringify(txs, null, 2));
  } catch (e) {
    console.error('ERRO: ' + e.message);
  }
}
audit();
