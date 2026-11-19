'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

interface AdminLoginProps {
  onLogin: (user: User) => void
  configured: boolean
  sessionError: string
}

export function AdminLogin({ onLogin, configured, sessionError }: AdminLoginProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(sessionError)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!configured || busy) return
    const fields = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const { data, error } = await createClient().auth.signInWithPassword({
        email: String(fields.get('email')).trim(),
        password: String(fields.get('password')),
      })
      if (error || !data.user) {
        setError(error?.code === 'invalid_credentials' || error?.status === 400
          ? 'El correo o la contraseña son incorrectos.'
          : 'No pudimos iniciar sesión. Intentá de nuevo.')
      } else {
        onLogin(data.user)
      }
    } catch {
      setError('No pudimos conectar con el estudio. Revisá tu conexión e intentá de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-svh bg-background px-5 py-6 text-foreground sm:p-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <Link href="/" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Volver al estudio</Link>
        <div className="my-auto grid gap-10 py-12 md:grid-cols-2 md:items-center md:gap-20">
          <div className="border-t border-primary/60 pt-5">
            <span className="text-xs font-semibold uppercase tracking-[.24em] text-primary">Barbería</span>
            <p className="mt-4 font-serif text-6xl leading-[.93] tracking-[-.055em] sm:text-8xl">Richard<br /><i>Dure</i></p>
          </div>
          <section aria-labelledby="login-title" className="border-t border-border pt-5">
            <h1 id="login-title" className="font-serif text-4xl tracking-tight">Acceso al estudio</h1>
            <p className="mt-2 text-sm text-muted-foreground">Ingresá para administrar tu agenda.</p>
            <form className="mt-8 grid gap-5" onSubmit={submit} aria-busy={busy}>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" name="email" type="email" autoComplete="username" required className="h-12" disabled={busy || !configured} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="h-12 pr-14" disabled={busy || !configured} />
                  <button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-foreground hover:text-foreground" disabled={busy || !configured}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {!configured && <p role="status" className="text-sm text-primary">El acceso al estudio está temporalmente fuera de servicio.</p>}
              {error && <p role="alert" className="text-sm text-foreground">{error}</p>}
              <Button disabled={busy || !configured} type="submit" className="h-12 justify-between px-5">
                {busy ? 'Ingresando…' : 'Iniciar sesión'}<ArrowRight />
              </Button>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}
