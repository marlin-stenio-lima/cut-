const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('', '');

async function check() {
  try {
    const { data, error } = await supabase.from('profiles').select('id, full_name, balance, asaas_customer_id, updated_at').order('updated_at', { ascending: false }).limit(5);
    if (error) throw error;
    process.stdout.write(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
