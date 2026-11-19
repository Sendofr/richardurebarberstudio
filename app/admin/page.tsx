'use client'

import { useEffect, useState } from 'react'
import { AdminLogin } from '@/components/admin/admin-login'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(configured)
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    if (!configured) return
    const supabase = createClient()
    let active = true
    let receivedEvent = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      receivedEvent = true
      setUser(session?.user ?? null)
      setLoading(false)
      setSessionError('')
    })
    async function restoreSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!active || receivedEvent) return
        if (error) throw error
        setUser(data.session?.user ?? null)
      } catch {
        if (active && !receivedEvent) setSessionError('No pudimos recuperar tu sesión. Volvé a ingresar.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void restoreSession()
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function logout() {
    const { error } = await createClient().auth.signOut()
    if (error) throw error
    setUser(null)
  }

  if (loading) return <main className="grid min-h-svh place-items-center bg-background"><p role="status">Cargando tu sesión…</p></main>
  if (!user) return <AdminLogin onLogin={setUser} configured={configured} sessionError={sessionError} />
  return <AdminDashboard key={user.id} user={user} onLogout={logout} />
}
