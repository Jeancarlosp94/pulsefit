import type { Session, User } from '@supabase/supabase-js'
import type { Tables } from './database'

export type ItfUser = User
export type ItfSession = Session
export type ItfProfile = Tables<'profiles'>

export interface ItfSignInPayload {
   email: string
   password: string
}

export interface ItfSignUpPayload {
   email: string
   password: string
   name?: string
   acceptedTerms: boolean
}

export interface ItfForgotPasswordPayload {
   email: string
}

export type ItfAuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
