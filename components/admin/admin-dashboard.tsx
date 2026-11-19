'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { CalendarDays, LockKeyhole, LogOut, RefreshCw, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FinancePanel } from '@/components/admin/finance-panel'
import { createClient } from '@/lib/supabase/client'
import { ALL_TIME_SLOTS } from '@/lib/mock-data'

interface Barbero {
  id: number
  nombre: string
}

interface Turno {
  id: string
  hora: string
  cliente_nombre: string
  cliente_telefono: string
  servicio: string | null
  estado: 'pendiente' | 'confirmado' | 'cancelado' | 'bloqueado'
}

interface DashboardProps {
  user: User
  onLogout: () => Promise<void>
}

const shopDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion', year: 'numeric', month: '2-digit', day: '2-digit' })
const friendlyDay = new Intl.DateTimeFormat('es-PY', { dateStyle: 'full', timeZone: 'UTC' })
const actionLabels = { confirmado: 'Cancelar', pendiente: 'Cancelar', bloqueado: 'Desbloquear', cancelado: 'Restaurar' }

export function AdminDashboard({ user, onLogout }: DashboardProps) {
  const [barber, setBarber] = useState<Barbero | null>(null)
  const [profileState, setProfileState] = useState<'loading' | 'error' | 'done'>('loading')
  const [profileAttempt, setProfileAttempt] = useState(0)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [agendaState, setAgendaState] = useState<'loading' | 'error' | 'done'>('loading')
  const [revision, setRevision] = useState(0)
  const [today, setToday] = useState(() => shopDay.format(new Date()))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [blocking, setBlocking] = useState(false)
  const [section, setSection] = useState<'agenda' | 'caja'>('agenda')

  useEffect(() => {
    const timer = window.setInterval(() => setToday(shopDay.format(new Date())), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function loadProfile() {
      setProfileState('loading')
      const { data, error } = await createClient().from('barberos')
        .select('id, nombre').eq('auth_user_id', user.id).abortSignal(controller.signal).maybeSingle()
      if (controller.signal.aborted) return
      setBarber(error ? null : data)
      setProfileState(error ? 'error' : 'done')
    }
    void loadProfile()
    return () => controller.abort()
  }, [user.id, profileAttempt])

  useEffect(() => {
    if (!barber) return
    const barberId = barber.id
    const controller = new AbortController()
    async function loadAgenda() {
      setAgendaState('loading')
      const { data, error } = await createClient().from('turnos')
        .select('id, hora, cliente_nombre, cliente_telefono, servicio, estado')
        .eq('fecha', today).eq('barbero_id', barberId).order('hora').abortSignal(controller.signal)
      if (controller.signal.aborted) return
      setTurnos(error ? [] : data || [])
      setAgendaState(error ? 'error' : 'done')
    }
    void loadAgenda()
    return () => controller.abort()
  }, [barber, today, revision])

  async function changeTurno(turno: Turno, action: 'cancelar' | 'confirmar' | 'desbloquear') {
    if (!barber || busy) return
    setBusy(true)
    setMessage('')
    setActionError('')
    try {
      const table = createClient().from('turnos')
      const next = action === 'confirmar' ? 'confirmado' : 'cancelado'
      const query = action === 'desbloquear' ? table.delete() : table.update({ estado: next })
      const { data, error } = await query.eq('id', turno.id).eq('barbero_id', barber.id)
        .eq('estado', turno.estado).select('id').maybeSingle()
      if (error?.code === '23505') setActionError('Ya se ocupó ese horario. Elegí otro turno.')
      else if (error || !data) setActionError('No se pudo aplicar el cambio. Revisá la agenda actualizada.')
      else if (action === 'desbloquear') setMessage('Horario desbloqueado.')
      else if (action === 'cancelar') setMessage('Turno cancelado.')
      else setMessage(turno.estado === 'pendiente' ? 'Turno confirmado.' : 'Turno restaurado.')
    } catch {
      setActionError('No pudimos verificar el cambio. Revisá la agenda antes de volver a intentar.')
    } finally {
      setBusy(false)
      setRevision(value => value + 1)
    }
  }

  async function blockTime(time: string) {
    if (!barber || busy) return
    setBusy(true)
    setActionError('')
    setMessage('')
    try {
      const { error } = await createClient().from('turnos').insert({
        barbero_id: barber.id, fecha: today, hora: time + ':00',
        cliente_nombre: 'BLOQUEADO', cliente_telefono: 'N/A', estado: 'bloqueado',
      })
      if (error) setActionError(error.code === '23505' ? 'Ese horario ya está ocupado.' : 'No pudimos bloquear el horario.')
      else {
        setBlocking(false)
        setMessage('Horario bloqueado a las ' + time + '.')
      }
    } catch {
      setActionError('No pudimos verificar el bloqueo. Revisá tu conexión.')
    } finally {
      setBusy(false)
      setRevision(value => value + 1)
    }
  }

  async function logout() {
    setBusy(true)
    try {
      await onLogout()
    } catch {
      setActionError('No pudimos cerrar la sesión. Volvé a intentar.')
    } finally {
      setBusy(false)
    }
  }

  const occupied = new Set(turnos.filter(turno => turno.estado !== 'cancelado').map(turno => turno.hora.slice(0, 5)))
  const counts = [
    { label: 'Confirmados', value: turnos.filter(turno => turno.estado === 'confirmado').length },
    { label: 'Pendientes', value: turnos.filter(turno => turno.estado === 'pendiente').length },
    { label: 'Cancelados', value: turnos.filter(turno => turno.estado === 'cancelado').length },
  ]

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="Richard Dure, inicio" className="font-serif text-2xl tracking-tight">Richard <i>Dure</i></Link>
          <Button variant="outline" className="h-11" disabled={busy} onClick={logout}><LogOut />Salir</Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-14">
        {profileState === 'loading' ? <p role="status">Cargando tu perfil…</p> : !barber ? (
          <section className="max-w-lg">
            <h1 className="font-serif text-4xl">{profileState === 'error' ? 'No pudimos verificar tu perfil' : 'Acceso sin perfil de barbero'}</h1>
            <p className="my-4 text-muted-foreground">{profileState === 'error' ? 'Comprobá tu conexión y volvé a intentar.' : 'Tu cuenta necesita un perfil de barbero vinculado para acceder a la agenda.'}</p>
            <Button variant="outline" onClick={() => setProfileAttempt(value => value + 1)}>Volver a comprobar</Button>
          </section>
        ) : (
          <>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.18em] text-primary">{barber.nombre}</p>
            <h1 className="font-serif text-5xl tracking-[-.045em] sm:text-7xl">{section === 'agenda' ? 'Agenda del día' : 'Caja personal'}</h1>
            <nav aria-label="Secciones del panel" className="my-6 flex gap-2 border-b border-border pb-5">
              <Button variant={section === 'agenda' ? 'default' : 'outline'} aria-pressed={section === 'agenda'} className="h-11" onClick={() => setSection('agenda')}><CalendarDays /> Agenda</Button>
              <Button variant={section === 'caja' ? 'default' : 'outline'} aria-pressed={section === 'caja'} className="h-11" onClick={() => setSection('caja')}><Wallet /> Caja</Button>
            </nav>
            {section === 'caja' ? <FinancePanel key={barber.id} barberId={barber.id} /> : (
              <section aria-label="Agenda de hoy">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="font-serif text-xl capitalize sm:text-2xl">{friendlyDay.format(new Date(today + 'T12:00:00Z'))}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" className="h-11" disabled={busy || agendaState === 'loading'} onClick={() => setRevision(value => value + 1)}><RefreshCw />Actualizar</Button>
                    <Dialog open={blocking} onOpenChange={open => { setBlocking(open); setActionError('') }}>
                      <DialogTrigger asChild><Button className="h-11" variant="secondary" disabled={busy || agendaState !== 'done'}><LockKeyhole />Bloquear horario</Button></DialogTrigger>
                      <DialogContent className="max-h-[88svh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Bloquear horario</DialogTitle><DialogDescription>Elegí un horario para bloquear en tu agenda de hoy.</DialogDescription></DialogHeader>
                        {actionError && <p role="alert">{actionError}</p>}
                        <div className="grid grid-cols-3 gap-2">
                          {ALL_TIME_SLOTS.map(time => <button key={time} type="button" disabled={busy || occupied.has(time) || agendaState !== 'done'} onClick={() => blockTime(time)} className="rounded border border-border p-2 text-center hover:border-primary disabled:opacity-60">
                            <span className="block font-medium tabular-nums">{time}</span><small>{occupied.has(time) ? 'Ocupado' : 'Disponible'}</small>
                          </button>)}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                {agendaState === 'loading' ? <p className="py-8" role="status">Cargando turnos…</p> : agendaState === 'error' ? <p className="py-8" role="alert">No pudimos cargar los turnos. Usá el botón Actualizar para reintentar.</p> : (
                  <>
                    <dl className="my-6 grid grid-cols-3 divide-x divide-border border-y border-border bg-card py-5">
                      {counts.map(({ label, value }) => <div key={label} className="flex flex-col-reverse gap-1 px-2 text-center sm:px-6 sm:text-left"><dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt><dd className="font-serif text-3xl tabular-nums">{value}</dd></div>)}
                    </dl>
                    {turnos.length === 0 ? <p className="py-5 text-muted-foreground">No hay turnos para hoy.</p> : (
                      <ul className="divide-y divide-border border-b border-border">
                        {turnos.map(turno => <li key={turno.id} className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-2 py-4 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
                          <span className="font-serif text-2xl tabular-nums text-primary">{turno.hora.slice(0, 5)}</span>
                          <div className="min-w-0 break-words">
                            <p className="font-medium">{turno.estado === 'bloqueado' ? 'Horario bloqueado' : turno.cliente_nombre}</p>
                            {turno.estado !== 'bloqueado' && <p className="mt-1 text-sm text-muted-foreground">{[turno.servicio, turno.cliente_telefono].filter(Boolean).join(' · ')}</p>}
                          </div>
                          <div className="col-start-2 flex flex-wrap items-center justify-between gap-2 sm:col-start-auto sm:gap-4">
                            <span className="text-sm capitalize text-muted-foreground">{turno.estado}</span>
                            {turno.estado === 'pendiente' && (
                              <Button className="h-11" disabled={busy} onClick={() => changeTurno(turno, 'confirmar')} aria-label={'Confirmar turno de las ' + turno.hora.slice(0, 5)}>
                                Confirmar
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              className="h-11"
                              disabled={busy}
                              onClick={() => changeTurno(turno, turno.estado === 'bloqueado' ? 'desbloquear' : turno.estado === 'cancelado' ? 'confirmar' : 'cancelar')}
                              aria-label={actionLabels[turno.estado] + ' turno de las ' + turno.hora.slice(0, 5)}
                            >
                              {actionLabels[turno.estado]}
                            </Button>
                          </div>
                        </li>)}
                      </ul>
                    )}
                  </>
                )}
              </section>
            )}
          </>
        )}
        <p role="status" className="mt-4 text-sm text-primary">{message}</p>
        {actionError && !blocking && <p role="alert" className="mt-4">{actionError}</p>}
      </main>
    </div>
  )
}
