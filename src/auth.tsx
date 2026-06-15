import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

// 직원 공용 로그인용 고정 이메일 (화면에는 노출하지 않음)
const STAFF_EMAIL = 'staff@roombar.app'

interface AuthState {
  session: Session | null
  loading: boolean
  signIn: (password: string) => Promise<string | null> // 실패 시 에러 메시지
  signOut: () => void
}

const Ctx = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async (password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: STAFF_EMAIL, password })
    return error ? error.message : null
  }
  const signOut = () => void supabase.auth.signOut()

  return <Ctx.Provider value={{ session, loading, signIn, signOut }}>{children}</Ctx.Provider>
}
