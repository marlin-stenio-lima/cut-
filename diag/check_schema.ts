import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function checkSchema() {
  const url = 'https://bxhymspdioxddhacxvrt.supabase.co'
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(url, key)

  console.log('--- TABLES ---')
  const { data: tables } = await supabase.rpc('get_tables')
  // If RPC doesn't exist, try a select from a common table to see columns
  const { data: columns } = await supabase.from('projects').select('*').limit(1)
  
  console.log('PROJECTS_COLUMNS:' + (columns && columns.length > 0 ? Object.keys(columns[0]).join(', ') : 'EMPTY'))
}
checkSchema()
