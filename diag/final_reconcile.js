const { createClient } = require('@supabase/supabase-js');
const url = 'https://bxhymspdioxddhacxvrt.supabase.co';
const key = '';
const supabase = createClient(url, key);

async function fix() {
  const userId = '798d7112-c8b5-4a9e-b655-be882ab399f3';
  console.log('Final Fix Start...');
  try {
    const { error: uError } = await supabase.from('profiles').update({ balance: 15.0 }).eq('id', userId);
    if (uError) throw uError;
    console.log('DONE_BALANCE_SET_TO_15');
  } catch (e) {
    console.error(e.message);
  }
}
fix();
