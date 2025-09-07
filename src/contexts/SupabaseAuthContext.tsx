// Supabase Authentication Context
// This file provides Supabase authentication context for future use
// Currently not used - the app uses mock authentication

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

// Types for Supabase authentication
interface SupabaseUser extends User {
  id: string
  email?: string
  role?: 'admin' | 'manager' | 'technician'
  created_at?: string
}

interface SupabaseAuthContextType {
  user: SupabaseUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ user: SupabaseUser | null; error: AuthError | null }>
  signUp: (email: string, password: string, userData?: { role?: string }) => Promise<{ user: SupabaseUser | null; error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: { email?: string; role?: string }) => Promise<{ error: AuthError | null }>
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
        toast.error('Failed to get session')
      } else {
        setSession(session)
        setUser(session?.user as SupabaseUser || null)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user as SupabaseUser || null)
        setLoading(false)

        if (event === 'SIGNED_IN') {
          toast.success('Successfully signed in!')
        } else if (event === 'SIGNED_OUT') {
          toast.success('Successfully signed out!')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        toast.error(error.message)
        return { user: null, error }
      }

      // Get user role from database
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (!userError && userData) {
          (data.user as SupabaseUser).role = userData.role
        }
      }

      return { user: data.user as SupabaseUser, error: null }
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Sign in failed')
      return { user: null, error: authError }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData?: { role?: string }) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      if (error) {
        toast.error(error.message)
        return { user: null, error }
      }

      // Create user record in database
      if (data.user) {
        const { error: dbError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            role: userData?.role || 'technician'
          })

        if (dbError) {
          console.error('Error creating user record:', dbError)
          toast.error('Failed to create user record')
        }
      }

      toast.success('Account created successfully! Please check your email to confirm your account.')
      return { user: data.user as SupabaseUser, error: null }
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Sign up failed')
      return { user: null, error: authError }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast.error(error.message)
        return { error }
      }

      return { error: null }
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Sign out failed')
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        toast.error(error.message)
        return { error }
      }

      toast.success('Password reset email sent!')
      return { error: null }
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Password reset failed')
      return { error: authError }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      })

      if (error) {
        toast.error(error.message)
        return { error }
      }

      toast.success('Password updated successfully!')
      return { error: null }
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Password update failed')
      return { error: authError }
    }
  }

  const updateProfile = async (updates: { email?: string; role?: string }) => {
    try {
      const updateData: any = {}
      
      if (updates.email) {
        updateData.email = updates.email
      }

      const { error: authError } = await supabase.auth.updateUser(updateData)

      if (authError) {
        toast.error(authError.message)
        return { error: authError }
      }

      // Update user role in database
      if (updates.role && user) {
        const { error: dbError } = await supabase
          .from('users')
          .update({ role: updates.role })
          .eq('id', user.id)

        if (dbError) {
          toast.error('Failed to update user role')
          return { error: dbError }
        }
      }

      toast.success('Profile updated successfully!')
      return { error: null }
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Profile update failed')
      return { error: authError }
    }
  }

  const value: SupabaseAuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile
  }

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext)
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

// Hook for checking user permissions
export function useSupabasePermissions() {
  const { user } = useSupabaseAuth()

  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager' || isAdmin
  const isTechnician = user?.role === 'technician' || isManager

  const canManageUsers = isAdmin
  const canManageDevices = isManager
  const canViewReports = isManager
  const canLogUtilization = isTechnician

  return {
    isAdmin,
    isManager,
    isTechnician,
    canManageUsers,
    canManageDevices,
    canViewReports,
    canLogUtilization
  }
}
