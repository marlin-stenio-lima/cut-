const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bxhymspdioxddhacxvrt.supabase.co', '');

async function fix() {
  try {
    // Find customers who were updated in the last 30 minutes
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name, balance, asaas_customer_id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (pError) throw pError;
    console.log('Profiles Recentos:');
    console.log(JSON.stringify(profiles, null, 2));

    // If we find one that is likely the user, we can manually check their balance
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
