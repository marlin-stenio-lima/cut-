const { createClient } = require('@supabase/supabase-js');
const url = 'https://bxhymspdioxddhacxvrt.supabase.co';
const key = '';
const supabase = createClient(url, key);

async function fix() {
  const userId = '798d7112-c8b5-4a9e-b655-be882ab399f3';
  console.log('Starting Fix...');
  try {
    const { data: p } = await supabase.from('profiles').select('balance').eq('id', userId).single();
    const nb = (p?.balance || 0) + 10;
    await supabase.from('profiles').update({ balance: nb }).eq('id', userId);
    await supabase.from('wallet_transactions').upsert([
      { asaas_id: 'pay_96i3u1ncp8f02m3n', user_id: userId, amount: 5, type: 'deposit', status: 'SUCCESS', description: 'PIX Recuperado' },
      { asaas_id: '96i3u1ncp8f02m3n_v2', user_id: userId, amount: 5, type: 'deposit', status: 'SUCCESS', description: 'PIX Recuperado 2' }
    ]);
    console.log('DONE_NEW_BALANCE_' + nb);
  } catch (e) { console.error(e.message); }
}
fix();
