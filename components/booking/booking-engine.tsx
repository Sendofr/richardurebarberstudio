'use client'

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CalendarCheck, Check, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { barbers as bookingCatalog, formatDate, generateTimeSlots, getNextDays, services } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/client'
import type { TimeSlot } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BookingEngineProps {
  preSelectedBarberId?: string
  preSelectedServiceId?: string
  isOpen: boolean
  onClose: () => void
}

interface Professional {
  id: string | number
  nombre: string
}

const stepTitles = ['Elegí tu servicio', 'Elegí tu profesional', 'Elegí día y hora', 'Completá tus datos']
const fullDate = (date: Date) => date.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' })
const dateKey = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')

function Choice({ selected, children, onClick, label }: {
  selected: boolean; children: ReactNode; onClick: () => void; label?: string
}) {
  return (
    <button type="button" aria-pressed={selected} aria-label={label} onClick={onClick}
      className={cn('flex min-h-12 items-center justify-between gap-3 border px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        selected ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-background hover:border-primary')}>
      {children}
      <span aria-hidden className={cn('grid size-5 shrink-0 place-items-center rounded-full border', selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground')}>
        {selected && <Check size={13} />}
      </span>
    </button>
  )
}

export function BookingEngine(props: BookingEngineProps) {
  if (!props.isOpen) return null
  return <BookingForm key={`${props.preSelectedServiceId || ''}/${props.preSelectedBarberId || ''}`} {...props} />
}

function BookingForm({ preSelectedBarberId, preSelectedServiceId, onClose }: BookingEngineProps) {
  const [serviceId, setServiceId] = useState(services.find(s => s.id === preSelectedServiceId)?.id ?? '')
  const [step, setStep] = useState(serviceId ? 1 : 0)
  const [professionals, setProfessionals] = useState<Professional[] | null>(null)
  const [barberId, setBarberId] = useState(preSelectedBarberId || '')
  const [profilesError, setProfilesError] = useState(false)
  const [profilesAttempt, setProfilesAttempt] = useState(0)
  const [days] = useState(() => getNextDays(14))
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState('')
  const [slots, setSlots] = useState<TimeSlot[] | null>(null)
  const [slotsError, setSlotsError] = useState(false)
  const [slotsAttempt, setSlotsAttempt] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [booked, setBooked] = useState(false)
  const submitLock = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const service = services.find(s => s.id === serviceId)
  const barber = professionals?.find(p => String(p.id) === barberId)

  useEffect(() => { heading.current?.focus() }, [step, booked])

  useEffect(() => {
    let current = true
    async function load() {
      try {
        const db = createClient()
        let { data, error } = await db.rpc('profesionales_reservables')
        if (error?.code === 'PGRST202') {
          // Compatibility with installations predating the public catalog projection.
          const legacy = await db.from('barberos').select('id,nombre')
            .in('id', bookingCatalog.map(b => b.id)).order('nombre')
          data = legacy.data
          error = legacy.error
        }
        if (error) throw error
        if (current) setProfessionals(data || [])
      } catch {
        if (current) setProfilesError(true)
      }
    }
    void load()
    return () => { current = false }
  }, [profilesAttempt])

  useEffect(() => {
    if (!date || !barberId) return
    let current = true
    const selectedDate = date
    async function load() {
      try {
        const db = createClient()
        const fecha = dateKey(selectedDate)
        let { data, error } = await db.rpc('horarios_ocupados', { p_fecha: fecha, p_barbero_id: barberId })
        if (error?.code === 'PGRST202') {
          // Older installations use their existing public availability policy.
          const legacy = await db.from('turnos').select('hora')
            .eq('fecha', fecha).eq('barbero_id', barberId).neq('estado', 'cancelado')
          data = legacy.data
          error = legacy.error
        }
        if (error) throw error
        const occupied = (data || []).map((row: { hora: string }) => row.hora.slice(0, 5))
        if (current) setSlots(generateTimeSlots(selectedDate, barberId, occupied))
      } catch {
        if (current) setSlotsError(true)
      }
    }
    void load()
    return () => { current = false }
  }, [barberId, date, slotsAttempt])

  function refreshSlots() {
    setSlots(null)
    setSlotsError(false)
    setTime('')
    setSlotsAttempt(n => n + 1)
  }

  async function confirm(event: FormEvent) {
    event.preventDefault()
    if (submitLock.current || !barber || !service || !date || !time || !name.trim() || !phone.trim()) return
    submitLock.current = true
    setSubmitting(true)
    setMessage('')
    try {
      const { error } = await createClient().from('turnos').insert([{
        barbero_id: barber.id, fecha: dateKey(date), hora: time + ':00', servicio: service.name,
        cliente_nombre: name.trim(), cliente_telefono: phone.trim(), estado: 'pendiente',
      }])
      if (error?.code === '23505' || /duplicate|unique/i.test(error?.message || '')) {
        refreshSlots()
        setMessage('Ese horario acaba de ocuparse. Elegí otro para continuar.')
        setStep(2)
      } else if (error) {
        setMessage('No pudimos registrar tu turno. Revisá la conexión y volvé a intentarlo.')
      } else {
        setBooked(true)
      }
    } catch {
      setMessage('No pudimos comprobar si se registró el turno. Consultá la disponibilidad antes de reintentar.')
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  const canContinue = [Boolean(service), Boolean(barber), Boolean(date && time && slots?.some(s => s.time === time && s.available))][step]
  return (
    <section id="booking" aria-labelledby="booking-title" className="scroll-mt-20 border-y border-border bg-card px-5 py-10 text-foreground sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <p className="text-xs font-semibold uppercase tracking-[.17em]">Richard Dure · Reservas</p>
          <Button type="button" variant="ghost" size="icon" className="size-11" disabled={submitting} onClick={onClose} aria-label="Cerrar reserva"><X /></Button>
        </div>
        <div className="grid items-start gap-7 lg:grid-cols-[1fr_290px] lg:gap-14">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{booked ? 'Solicitud registrada' : `Paso ${step + 1} de 4`}</p>
            <h2 id="booking-title" tabIndex={-1} ref={heading} className="mb-6 scroll-mt-28 font-serif text-4xl leading-tight focus:outline-none sm:text-5xl">
              {booked ? 'Tu turno quedó registrado.' : stepTitles[step]}
            </h2>
            {message && <p role="alert" className="mb-4 border-l-2 border-primary bg-background p-3 text-sm">{message}</p>}
            {booked ? (
              <div className="space-y-5">
                <p className="flex items-start gap-3"><CalendarCheck aria-hidden className="mt-0.5 shrink-0 text-primary" /> El estudio tiene tu solicitud. Está pendiente de confirmación.</p>
                <Button className="h-12" onClick={onClose}>Volver al inicio <ArrowRight /></Button>
              </div>
            ) : (
              <>
                {service && step > 0 && <p className="mb-4 text-sm lg:hidden"><span className="text-muted-foreground">Servicio elegido · </span>{service.name}</p>}
                {step === 0 && <div className="grid gap-2">{services.map(s =>
                  <Choice key={s.id} selected={serviceId === s.id} onClick={() => setServiceId(s.id)}>{s.name}</Choice>)}</div>}
                {step === 1 && (profilesError
                  ? <div role="alert"><p>No se pudo cargar el equipo del estudio.</p><Button className="mt-3" variant="outline" onClick={() => { setProfilesError(false); setProfilesAttempt(n => n + 1) }}>Reintentar</Button></div>
                  : professionals === null ? <p role="status">Cargando profesionales…</p>
                  : professionals.length === 0 ? <p role="status">Por el momento no hay profesionales disponibles para reservar.</p>
                  : <div className="grid gap-2">{professionals.map(p =>
                    <Choice key={p.id} selected={barberId === String(p.id)} onClick={() => {
                      if (String(p.id) !== barberId) { setDate(undefined); setTime(''); setSlots(null); setSlotsError(false); setBarberId(String(p.id)) }
                    }}>{p.nombre}</Choice>)}</div>)}
                {step === 2 && <div className="space-y-5">
                  <fieldset><legend className="mb-2 font-medium">Fecha</legend>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{days.map(day => {
                      const fmt = formatDate(day)
                      const chosen = date === day
                      return <button type="button" key={dateKey(day)} aria-pressed={chosen} aria-label={fullDate(day)}
                        onClick={() => { if (!chosen) { setDate(day); setTime(''); setSlots(null); setSlotsError(false); setMessage('') } }}
                        className={cn('min-h-14 border p-1.5 text-center focus-visible:outline-2 focus-visible:outline-ring',
                          chosen ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary')}>
                        <span className="block text-xs">{fmt.day}</span><span className="text-sm font-semibold">{fmt.dayNum} {fmt.month}</span>
                      </button>
                    })}</div>
                  </fieldset>
                  <fieldset><legend className="mb-2 font-medium">Horarios</legend>
                    {!date ? <p className="text-sm text-muted-foreground">Elegí el día para consultar su disponibilidad.</p>
                      : slotsError ? <div role="alert"><p>No se pudieron consultar los horarios.</p><Button className="mt-2" variant="outline" onClick={refreshSlots}>Reintentar</Button></div>
                      : !slots ? <p role="status">Consultando horarios…</p>
                      : <><p role="status" className="mb-3 text-sm text-muted-foreground">{slots.some(s => s.available)
                          ? `${slots.filter(s => s.available).length} horarios disponibles${slots.some(s => !s.available) ? ' · Los tachados están ocupados.' : '.'}`
                          : 'El día está completo. Probá otra fecha.'}</p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{slots.map(slot =>
                          <button key={slot.time} type="button" disabled={!slot.available} aria-pressed={time === slot.time}
                            aria-label={`${slot.time}, ${slot.available ? 'disponible' : 'ocupado'}`} onClick={() => { setTime(slot.time); setMessage('') }}
                            className={cn('min-h-11 border px-2 py-2 text-sm font-medium tabular-nums focus-visible:outline-2 focus-visible:outline-ring disabled:border-transparent disabled:text-muted-foreground disabled:line-through',
                              time === slot.time ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background')}>
                            {slot.time}
                          </button>)}</div></>}
                  </fieldset>
                </div>}
                {step === 3 && <form id="contacto-reserva" onSubmit={confirm} className="grid gap-4">
                  <div><Label htmlFor="booking-name">Nombre y apellido</Label><Input className="mt-2 h-12 text-base" id="booking-name" autoComplete="name" required value={name} onChange={e => setName(e.target.value)} /></div>
                  <div><Label htmlFor="booking-phone">Teléfono</Label><Input className="mt-2 h-12 text-base" id="booking-phone" type="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} /></div>
                </form>}
              </>
            )}
          </div>
          {(service || booked) && <aside aria-label="Resumen del turno" className="border-t border-border pt-4 lg:border lg:bg-background lg:p-5">
            <h3 className="mb-3 font-serif text-2xl">Tu turno</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Servicio</dt><dd className="text-right font-medium">{service?.name}</dd></div>
              {barber && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Profesional</dt><dd className="text-right">{barber.nombre}</dd></div>}
              {date && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Día</dt><dd className="text-right">{fullDate(date)}</dd></div>}
              {time && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Hora</dt><dd>{time}</dd></div>}
            </dl>
          </aside>}
        </div>
        {!booked && <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
          {step > 0 && <Button className="mr-auto h-12" type="button" variant="outline" disabled={submitting} onClick={() => { setMessage(''); setStep(s => s - 1) }}><ArrowLeft /> Atrás</Button>}
          {step < 3 ? <Button key="continue" type="button" className="h-12 px-6" disabled={!canContinue} onClick={() => setStep(s => s + 1)}>Continuar <ArrowRight /></Button>
            : <Button key="submit" form="contacto-reserva" type="submit" className="h-12 px-6" disabled={submitting || !name.trim() || !phone.trim()}>
              {submitting ? <><Loader2 className="animate-spin" /> Registrando…</> : <>Reservar turno <ArrowRight /></>}
            </Button>}
        </div>}
      </div>
    </section>
  )
}
