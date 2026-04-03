import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function audit() {
  const url = 'https://bxhymspdioxddhacxvrt.supabase.co'
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(url, key)

  console.log('--- AUDITORIA: cliente@gmail.com ---')
  const { data: profiles } = await supabase.from('profiles').select('*')
  const target = profiles.find(p => p.full_name?.toLowerCase().includes('cliente') || p.id === '798d7112-c8b5-4a9e-b655-be882ab399f3')

  if (!target) {
    console.log('PERFIL_NAO_ENCONTRADO')
    return
  }

  const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('user_id', target.id)
  
  console.log('USER_ID:' + target.id)
  console.log('BALANCE:' + target.balance)
  console.log('TXS:' + JSON.stringify(txs, null, 2))
}
audit()
