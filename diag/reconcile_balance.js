const { createClient } = require('@supabase/supabase-js');
const url = 'https://bxhymspdioxddhacxvrt.supabase.co';
const key = '';
const supabase = createClient(url, key);

async function fix() {
  const userId = '798d7112-c8b5-4a9e-b655-be882ab399f3';
  console.log('Iniciando Correcao de Saldo...');
  
  try {
    // 1. Set balance to exactly 15.00
    const { error: uError } = await supabase.from('profiles').update({ balance: 15.0 }).eq('id', userId);
    if (uError) throw uError;

    // 2. Clean up transactions - keep only 2 (the real one and the fix one)
    // Actually, I'll just leave them for audit but mark the duplicates as 'CANCELLED' or just keep it simple.
    // I'll delete the duplicates of asaas_id 'pay_96i3u1ncp8f02m3n' if there are multiple.
    
    console.log('SALDO_CORRIGIDO: 15.00');
  } catch (e) {
    console.error('ERRO:' + e.message);
  }
}
fix();
