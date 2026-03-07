import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bxhymspdioxddhacxvrt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aHltc3BkaW94ZGRoYWN4dnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDYwNTAsImV4cCI6MjA4NjMyMjA1MH0.7aGHS5lsJzkRAzXYvK6a5GP0cs4B5qE6tJ2Dm2NTL4Q'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testProfiles() {
    console.log('Testing Supabase profiles access for real user...')

    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'marlinstenio0312@gmail.com',
        password: 'Senha@1234'
    })

    if (authErr) {
        console.error('Failed to auth real user:', authErr.message)
        return
    } else {
        console.log('Authed as real user:', authData.user.id)
        await testProfileFetch(authData.user.id)
    }
}

async function testProfileFetch(userId: string) {
    console.log(`\n1. Testing SELECT for profile ${userId}`)

    const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) {
        console.error(`SELECT FAILED (Status: ${status}):`, error)
    } else {
        console.log('SELECT SUCCESS:', data)
    }

    console.log('\n2. Testing UPSERT for profile')
    const { error: upsertErr, status: upsertStatus } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            role: 'client',
            updated_at: new Date().toISOString()
        })

    if (upsertErr) {
        console.error(`UPSERT FAILED (Status: ${upsertStatus}):`, upsertErr)
    } else {
        console.log('UPSERT SUCCESS. Role should be client.')
    }

    console.log('\n3. Read again to verify')
    const res3 = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (res3.error) console.error('READ 2 FAILED:', res3.error)
    else console.log('READ 2 DATA:', res3.data)
}

testProfiles()
