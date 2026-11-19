'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type Movement = 'cobro' | 'devolucion' | 'gasto'
type Summary = { cobrado: number; devuelto: number; gastos: number; movimientos: number; sin_cobro: number }
type Appointment = { id: string | number; hora: string; cliente_nombre: string; servicio: string | null }
const inputStyle = 'block mt-1 w-full min-w-0 rounded-md border border-border bg-background px-3 py-2.5 text-foreground'
const money = new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 })
const localDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Asuncion', year: 'numeric', month: '2-digit', day: '2-digit',
})

function monthEnd(month: string) {
  const [year, number] = month.split('-').map(Number)
  return new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10)
}

export function FinancePanel({ barberId }: { barberId: number }) {
  const [supabase] = useState(() => createClient())
  const today = localDate.format(new Date())
  const [month, setMonth] = useState(today.slice(0, 7))
  const [reload, setReload] = useState(0)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [readError, setReadError] = useState(false)
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<Movement>('cobro')
  const [date, setDate] = useState(today)
  const [appointmentDay, setAppointmentDay] = useState(today)
  const [appointments, setAppointments] = useState<Appointment[] | null>(null)
  const [appointmentError, setAppointmentError] = useState(false)
  const [selected, setSelected] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const submission = useRef<{ payload: string; id: string } | null>(null)

  useEffect(() => {
    let active = true
    setSummary(null)
    setReadError(false)
    supabase.rpc('resumen_caja', { p_barbero: barberId, p_desde: month + '-01', p_hasta: monthEnd(month) })
      .single<Summary>().then(({ data, error }) => {
        if (active) {
          setReadError(Boolean(error || !data))
          setSummary(error ? null : data)
        }
      })
    return () => { active = false }
  }, [supabase, barberId, month, reload])

  useEffect(() => {
    let active = true
    setSelected('')
    setAppointments(null)
    setAppointmentError(false)
    if (open && kind !== 'gasto' && appointmentDay) {
      supabase.from('turnos').select('id,hora,cliente_nombre,servicio')
        .eq('barbero_id', barberId).eq('fecha', appointmentDay).neq('estado', 'bloqueado')
        .order('hora').then(({ data, error }) => {
          if (active) {
            setAppointments(error ? null : data)
            setAppointmentError(Boolean(error))
          }
        })
    }
    return () => { active = false }
  }, [supabase, barberId, appointmentDay, kind, open, reload])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || (kind !== 'gasto' && !selected)) return
    const values = {
      barbero_id: barberId, turno_id: kind === 'gasto' ? null : selected,
      tipo: kind, monto: Number(amount), fecha: date,
      concepto: kind === 'gasto' ? note.trim() : null,
    }
    const payload = JSON.stringify(values)
    if (submission.current?.payload !== payload) submission.current = { payload, id: crypto.randomUUID() }
    const id = submission.current.id
    setBusy(true)
    setFeedback('')
    try {
      const { error } = await supabase.from('caja_movimientos').insert({ id, ...values })
      if (error) {
        // A lost response can follow a successful write. Reuse the operation ID.
        const existing = await supabase.from('caja_movimientos').select('id').eq('id', id).maybeSingle()
        if (!existing.data) {
          setFeedback(error.code === '23514' && kind === 'devolucion'
            ? 'La devolución supera lo cobrado para ese turno a esa fecha. Revisá el importe.'
            : 'No se pudo confirmar el registro. Revisá la conexión y volvé a intentar.')
          return
        }
      }
      submission.current = null
      setAmount('')
      setNote('')
      setOpen(false)
      setMonth(date.slice(0, 7))
      setReload(n => n + 1)
      setFeedback('Movimiento registrado.')
    } catch {
      setFeedback('Se interrumpió la conexión. Volvé a intentar para confirmar el registro.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="my-9 border-y border-border py-6" aria-labelledby="caja-titulo">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="caja-titulo" className="font-serif text-3xl">Mi caja</h2>
          <p className="mt-1 text-sm text-muted-foreground">Movimientos en guaraníes · Hora de Paraguay</p>
        </div>
        <label className="text-sm">Período
          <input aria-label="Mes de caja" className={inputStyle} type="month" value={month}
            onChange={e => { if (/^\d{4}-\d{2}$/.test(e.target.value)) setMonth(e.target.value) }} />
        </label>
      </div>
      <div aria-live="polite" className="my-5">
        {readError ? (
          <div className="text-sm">
            No se pudo consultar tu caja. Verificá el acceso y la migración de caja.
            <Button type="button" variant="outline" size="sm" className="ml-2" onClick={() => setReload(n => n + 1)}>Reintentar</Button>
          </div>
        ) : summary ? (
          <>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
              {[
                ['Cobrado', summary.cobrado], ['Devoluciones', summary.devuelto],
                ['Gastos', summary.gastos], ['Resultado', summary.cobrado - summary.devuelto - summary.gastos],
              ].map(([label, value]) => (
                <div key={label} className={label === 'Resultado' ? 'bg-primary p-3 text-primary-foreground' : 'bg-card p-3'}>
                  <dt className="text-sm">{label}</dt><dd className="mt-2 break-words text-xl font-medium tabular-nums">{money.format(Number(value))}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm text-muted-foreground">
              {summary.movimientos === 0 ? 'Período sin movimientos registrados. ' : 'El resultado incluye solo movimientos registrados. '}
              {summary.sin_cobro > 0 && `Registro incompleto: hay ${summary.sin_cobro} turno(s) transcurrido(s) sin cobro asentado al cierre del período. `}
              Los gastos pendientes de carga quedan fuera del resultado.
            </p>
          </>
        ) : <p className="text-sm text-muted-foreground">Cargando movimientos…</p>}
      </div>
      <Button type="button" aria-expanded={open} aria-controls="registro-caja" disabled={busy}
        onClick={() => { setOpen(!open); setFeedback('') }} variant="outline">
        {open ? 'Cerrar registro' : 'Registrar movimiento'}
      </Button>
      {open && (
        <form id="registro-caja" className="mt-4 max-w-2xl" onSubmit={save}>
          <fieldset disabled={busy} className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <label>Tipo de movimiento
              <select className={inputStyle} value={kind} onChange={e => setKind(e.target.value as Movement)}>
                <option value="cobro">Cobro de turno</option><option value="devolucion">Devolución de turno</option><option value="gasto">Gasto</option>
              </select>
            </label>
            <label>Fecha del movimiento
              <input type="date" className={inputStyle} required max={today} value={date} onChange={e => setDate(e.target.value)} />
            </label>
            {kind !== 'gasto' && <>
              <label>Fecha del turno
                <input type="date" required className={inputStyle} value={appointmentDay} onChange={e => setAppointmentDay(e.target.value)} />
              </label>
              <label>Turno
                <select className={inputStyle} aria-label="Turno" required value={selected} onChange={e => setSelected(e.target.value)} disabled={!appointments?.length}>
                  <option value="">{appointmentError ? 'Error al cargar turnos' : appointments === null ? 'Cargando…' : appointments.length ? 'Elegí un turno' : 'Sin turnos ese día'}</option>
                  {appointments?.map(t => <option key={t.id} value={t.id}>{t.hora.slice(0, 5)} · {t.cliente_nombre}{t.servicio ? ' · ' + t.servicio : ''}</option>)}
                </select>
              </label>
              {appointmentError && <Button type="button" variant="outline" onClick={() => setReload(n => n + 1)}>Reintentar carga de turnos</Button>}
            </>}
            {kind === 'gasto' && <label>Concepto
              <input className={inputStyle} required maxLength={160} pattern=".*\S.*" value={note} onChange={e => setNote(e.target.value)} />
            </label>}
            <label>Importe en guaraníes
              <input className={inputStyle} type="number" inputMode="numeric" min="1" max="2147483647" step="1" required value={amount} onChange={e => setAmount(e.target.value)} />
            </label>
            <Button type="submit" className="sm:col-span-2 sm:justify-self-start" disabled={busy || (kind !== 'gasto' && !selected)}>
              {busy ? 'Registrando…' : 'Guardar movimiento'}
            </Button>
          </fieldset>
        </form>
      )}
      <p role="status" className="mt-2 text-sm">{feedback}</p>
    </section>
  )
}
