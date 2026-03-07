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

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
        )

        try {
            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

            if (error) {
                console.warn('[AuthContext] Profile not found or error fetching:', error.message)
                setProfile(null)
            } else {
                console.log('[AuthContext] Profile loaded:', data?.role)
                setProfile(data)
            }
        } catch (err: any) {
            console.error('[AuthContext] Error in fetchProfile:', err.message)
            setProfile(null)
        }
    }

    useEffect(() => {
        let mounted = true
        console.log('[AuthContext] Initializing AuthProvider with v2 storage...')

        // Fallback safety timeout for the entire initialization
        const globalFallback = setTimeout(() => {
            if (mounted && loading) {
                console.warn('[AuthContext] Global fallback timeout hit. Forcing stop loading.')
                setLoading(false)
            }
        }, 8000)

        const initializeAuth = async () => {
            try {
                const sessionPromise = supabase.auth.getSession()
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('getSession timeout')), 4000)
                )

                // Get initial session with timeout
                const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any

                if (error) {
                    console.error('[AuthContext] getSession error:', error.message)
                    if (mounted) setLoading(false)
                    return
                }

                console.log('[AuthContext] Initial session retrieved:', session ? 'User present' : 'No user')

                if (mounted) {
                    setSession(session)
                    setUser(session?.user ?? null)
                }

                if (session?.user && mounted) {
                    await fetchProfile(session.user.id)
                }
            } catch (err: any) {
                console.error('[AuthContext] Unexpected error during init:', err.message)
            } finally {
                if (mounted) {
                    console.log('[AuthContext] Initialization complete, setting loading to false')
                    setLoading(false)
                    clearTimeout(globalFallback)
                }
            }
        }

        initializeAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log(`[AuthContext] Auth state change event: ${event}`)

            if (!mounted) return

            // Ensure we show loading if a significant auth event happens
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                setLoading(true)
            }

            setSession(newSession)
            setUser(newSession?.user ?? null)

            if (newSession?.user) {
                await fetchProfile(newSession.user.id)
            } else {
                setProfile(null)
            }

            if (mounted) setLoading(false)
        })

        return () => {
            mounted = false
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
