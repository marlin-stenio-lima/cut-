const { createClient } = require('@supabase/supabase-js');
const url = 'https://bxhymspdioxddhacxvrt.supabase.co';
const key = '';
const supabase = createClient(url, key);

async function check() {
  const userId = '798d7112-c8b5-4a9e-b655-be882ab399f3';
  try {
    const { data: profile } = await supabase.from('profiles').select('balance, full_name').eq('id', userId).single();
    const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    
    console.log('--- USER STATUS ---');
    console.log('Name: ' + profile.full_name);
    console.log('Balance: ' + profile.balance);
    console.log('Transactions Count: ' + txs.length);
    console.log(JSON.stringify(txs, null, 2));
  } catch (e) {
    console.error(e.message);
  }
}
check();
