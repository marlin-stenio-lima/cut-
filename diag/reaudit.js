const { createClient } = require('@supabase/supabase-js');
const url = 'https://bxhymspdioxddhacxvrt.supabase.co';
const key = '';
const supabase = createClient(url, key);

async function run() {
  // Use RPC to add constraint if possible, but let's try a direct update first to see if it even works
  // Actually, I'll just fix the CODE to be atomic.
  
  // 1. Audit user balance
  const userId = '798d7112-c8b5-4a9e-b655-be882ab399f3';
  const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single();
  const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('user_id', userId);
  
  console.log('AUDIT_START');
  console.log('BALANCE:' + profile.balance);
  console.log('TXS:' + JSON.stringify(txs));
}
run();
