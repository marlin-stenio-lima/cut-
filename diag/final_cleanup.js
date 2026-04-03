const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bxhymspdioxddhacxvrt.supabase.co', '');

async function clean() {
  const userId = '798d7112-c8b5-4a9e-b655-be882ab399f3';
  console.log('--- LIMPANDO CONTA: ' + userId + ' ---');
  
  try {
    // 1. Reset balance to 0
    const { error: pError } = await supabase.from('profiles').update({ balance: 0 }).eq('id', userId);
    if (pError) throw pError;
    console.log('SALDO_ZERADO');

    // 2. Delete all transactions
    const { error: tError } = await supabase.from('wallet_transactions').delete().eq('user_id', userId);
    if (tError) throw tError;
    console.log('TRANSACOES_APAGADAS');

    process.stdout.write('CLEAN_SUCCESS');
  } catch (e) {
    process.stderr.write('CLEAN_ERROR: ' + e.message);
    process.exit(1);
  }
}
clean();
