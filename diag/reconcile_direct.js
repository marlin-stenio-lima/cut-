const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bxhymspdioxddhacxvrt.supabase.co', '');
async function fix() {
  try {
    const { error } = await supabase.from('profiles').update({ balance: 15.0 }).eq('id', '798d7112-c8b5-4a9e-b655-be882ab399f3');
    if (error) throw error;
    console.log('SUCCESS_BALANCE_SET');
  } catch (e) {
    console.error(e.message);
  }
}
fix();
