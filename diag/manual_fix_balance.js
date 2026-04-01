const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bxhymspdioxddhacxvrt.supabase.co', '');

async function fix() {
  const userId = '798d7112-c8b5-4a9e-b655-be882ab399f3';
  const paymentIds = ['pay_96i3u1ncp8f02m3n', '96i3u1ncp8f02m3n']; // From screenshot
  const totalAmount = 10; // Two R$ 5,00 payments shown in Asaas screenshot

  console.log('--- Iniciando Correcão Manual para ' + userId + ' ---');
  
  try {
    // 1. Check profile
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('balance, full_name')
      .eq('id', userId)
      .single();
    
    if (pError) throw pError;
    console.log('Perfil encontrado: ' + profile.full_name + ', Saldo Atual: ' + profile.balance);

    // 2. Insert transactions if they don't exist
    for (const pid of paymentIds) {
        await supabase.from('wallet_transactions').upsert({
            user_id: userId,
            amount: 5,
            type: 'deposit',
            status: 'SUCCESS',
            description: 'Recarga de Saldo (Fix Manual)',
            asaas_id: pid
        }, { onConflict: 'asaas_id' });
    }

    // 3. Update Balance
    const newBalance = Number(profile.balance || 0) + totalAmount;
    const { error: uError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);
    
    if (uError) throw uError;
    console.log('--- SUCESSO! Novo Saldo: ' + newBalance + ' ---');

  } catch (err) {
    console.error('ERRO NO FIX:', err.message);
    process.exit(1);
  }
}
fix();
