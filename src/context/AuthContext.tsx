import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

interface AuthContextType {
    session: Session | null
    user: User | null
    profile: any | null
    loading: boolean
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
    updateProfileLocally: (data: any) => void
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
    updateProfileLocally: () => { },
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = async (userId: string) => {
        console.log(`[AuthContext] Fetching profile for ${userId}...`)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.warn('[AuthContext] Profile not found or error fetching:', error.message)
                setProfile(null)
            } else {
                console.log('[AuthContext] Profile loaded:', data.role)
                setProfile(data)
            }
        } catch (err) {
            console.error('[AuthContext] Error in fetchProfile:', err)
            setProfile(null)
        }
    }

    useEffect(() => {
        console.log('[AuthContext] Initializing AuthProvider...')

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('[AuthContext] Session received:', session ? 'User present' : 'No user')
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id).finally(() => {
                    console.log('[AuthContext] Initialization complete (User found)')
                    setLoading(false)
                })
            } else {
                console.log('[AuthContext] Initialization complete (No user)')
                setLoading(false)
            }
        }).catch(err => {
            console.error('[AuthContext] getSession error:', err)
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[AuthContext] Auth state change: ${event}`)
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                await fetchProfile(session.user.id)
            } else {
                setProfile(null)
            }
            setLoading(false)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    const refreshProfile = async () => {
        if (user) {
            console.log('[AuthContext] Manual profile refresh requested...')
            await fetchProfile(user.id)
        }
    }

    const updateProfileLocally = (data: any) => {
        console.log('[AuthContext] Optimistic profile update:', data.role)
        setProfile((prev: any) => ({ ...prev, ...data }))
    }

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile, updateProfileLocally }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
