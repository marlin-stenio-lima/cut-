import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('[Supabase Init] URL present:', !!supabaseUrl)
console.log('[Supabase Init] Key present:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase Init] CRITICAL: Missing Supabase environment variables!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storageKey: 'cut-house-auth-v2', // Bypasses deadlocked browser Web Locks
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
})
