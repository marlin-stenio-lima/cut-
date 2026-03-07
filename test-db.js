import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testProfiles() {
    console.log('Testing Supabase profiles access...')

    // Try to login as the test user
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'test123456@gmail.com',
        password: '123456'
    })

    if (authErr) {
        console.error('Failed to auth test user:', authErr.message)
        // Let's try the user's email from the screenshot: marlinstenio0312@gmail.com
        const { data: authData2, error: authErr2 } = await supabase.auth.signInWithPassword({
            email: 'marlinstenio0312@gmail.com',
            password: 'Senha@1234'
        })
        if (authErr2) {
            console.error('Failed to auth real user:', authErr2.message)
            return
        } else {
            console.log('Authed as real user:', authData2.user.id)
            await testProfileFetch(authData2.user.id)
        }
    } else {
        console.log('Authed as test user:', authData.user.id)
        await testProfileFetch(authData.user.id)
    }
}

async function testProfileFetch(userId) {
    console.log(`\n1. Testing SELECT for profile ${userId}`)

    // First, let's see if we can read the profile
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
    // Let's test if we can update the role
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

    // Read again
    console.log('\n3. Read again to verify')
    const res3 = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (res3.error) console.error('READ 2 FAILED:', res3.error)
    else console.log('READ 2 DATA:', res3.data)
}

testProfiles()
