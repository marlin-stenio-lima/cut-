const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bxhymspdioxddhacxvrt.supabase.co', '');

async function audit() {
  try {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const profile = profiles.find(p => p.full_name?.toLowerCase().includes('cliente') || p.id === '798d7112-c8b5-4a9e-b655-be882ab399f3');
    
    if (!profile) {
      console.log('AUDIT_FAIL: Profile not found');
      return;
    }

    const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('user_id', profile.id);
    const { data: projects } = await supabase.from('projects').select('*').eq('client_id', profile.id);

    console.log('AUDIT_DATA_START');
    console.log('ID: ' + profile.id);
    console.log('NAME: ' + profile.full_name);
    console.log('BALANCE: ' + profile.balance);
    console.log('TRANSACTIONS: ' + JSON.stringify(txs));
    console.log('PROJECTS: ' + JSON.stringify(projects));
  } catch (e) {
    console.error('ERROR: ' + e.message);
  }
}
audit();
