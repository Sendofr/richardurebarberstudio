'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { barbers, services, generateTimeSlots, getNextDays, formatDate, formatPrice, ALL_TIME_SLOTS } from '@/lib/mock-data'
import { BookingFormData, TimeSlot } from '@/lib/types'
import { toast } from 'sonner'
import { User, Calendar, Clock, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface BookingEngineProps {
  preSelectedBarberId?: string
  isOpen: boolean
  onClose: () => void
}

export function BookingEngine({ preSelectedBarberId, isOpen, onClose }: BookingEngineProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<BookingFormData>({
    barberId: preSelectedBarberId || '',
    date: undefined,
    time: '',
    service: '',
    clientName: '',
    clientPhone: ''
  })
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [availableDays] = useState(getNextDays(14))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (preSelectedBarberId) {
      setFormData(prev => ({ ...prev, barberId: preSelectedBarberId }))
    }
  }, [preSelectedBarberId])

  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  useEffect(() => {
    const fetchOccupiedSlots = async () => {
      if (!formData.date || !formData.barberId) return
      
      setIsLoadingSlots(true)
      
      const supabase = createClient()
      
      // Format date as YYYY-MM-DD
      const year = formData.date.getFullYear()
      const month = String(formData.date.getMonth() + 1).padStart(2, '0')
      const day = String(formData.date.getDate()).padStart(2, '0')
      const fechaStr = `${year}-${month}-${day}`
      
      // Query occupied slots from Supabase (all states except cancelado)
      const { data, error } = await supabase
        .from('turnos')
        .select('hora')
        .eq('fecha', fechaStr)
        .eq('barbero_id', formData.barberId)
        .neq('estado', 'cancelado')
      
      if (error) {
        console.error('[v0] Error fetching occupied slots:', error)
        setTimeSlots(generateTimeSlots(formData.date, formData.barberId, []))
      } else {
        // Extract occupied times (slice to get HH:MM format)
        const occupiedTimes = (data || []).map(t => t.hora.slice(0, 5))
        setTimeSlots(generateTimeSlots(formData.date, formData.barberId, occupiedTimes))
      }
      
      setIsLoadingSlots(false)
    }
    
    fetchOccupiedSlots()
  }, [formData.date, formData.barberId])

  const handleSelectBarber = (barberId: string) => {
    setFormData(prev => ({ ...prev, barberId }))
  }

  const handleSelectDate = (date: Date) => {
    setFormData(prev => ({ ...prev, date, time: '' }))
  }

  const handleSelectTime = (time: string) => {
    setFormData(prev => ({ ...prev, time }))
  }

  const handleSelectService = (serviceId: string) => {
    setFormData(prev => ({ ...prev, service: serviceId }))
  }

  const scrollDays = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const handleConfirm = async () => {
    const selectedBarber = barbers.find(b => b.id === formData.barberId)
    const selectedService = services.find(s => s.id === formData.service)
    
    if (!selectedBarber || !selectedService || !formData.date) {
      toast.error('Faltan datos para completar la reserva')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      
      // Format date as YYYY-MM-DD
      const year = formData.date.getFullYear()
      const month = String(formData.date.getMonth() + 1).padStart(2, '0')
      const day = String(formData.date.getDate()).padStart(2, '0')
      const fechaFormatted = `${year}-${month}-${day}`
      
      // Format time with seconds for SQL TIME type
      const horaFormatted = `${formData.time}:00`

      const { error } = await supabase.from('turnos').insert([{
        barbero_id: selectedBarber.id,
        fecha: fechaFormatted,
        hora: horaFormatted,
        servicio: selectedService.name,
        cliente_nombre: formData.clientName,
        cliente_telefono: formData.clientPhone,
        estado: 'pendiente'
      }])

      if (error) {
        // Check for duplicate/conflict error
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          toast.error('Este horario acaba de ser ocupado. Por favor, elige otro.', {
            duration: 5000,
          })
        } else {
          toast.error('Error al crear la reserva. Intenta nuevamente.', {
            description: error.message,
            duration: 5000,
          })
        }
        return
      }

      // Success
      toast.success('¡Reserva confirmada con éxito!', {
        description: `Tu cita con ${selectedBarber.name} para ${selectedService.name} el ${formData.date.toLocaleDateString('es-PY')} a las ${formData.time} ha sido reservada.`,
        duration: 8000,
      })
      
      // Reset form
      setFormData({
        barberId: '',
        date: undefined,
        time: '',
        service: '',
        clientName: '',
        clientPhone: ''
      })
      setStep(1)
      onClose()
      
    } catch (err) {
      toast.error('Error inesperado. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedToStep2 = formData.barberId !== ''
  const canProceedToStep3 = formData.date !== undefined
  const canProceedToStep4 = formData.time !== ''
  const canProceedToStep5 = formData.service !== ''
  const canConfirm = formData.clientName !== '' && formData.clientPhone !== ''

  if (!isOpen) return null

  return (
    <section id="booking" className="py-16 px-4 bg-card/50">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-foreground mb-2">
            Agenda tu Turno
          </h2>
          <p className="text-muted-foreground">
            Desliza para ver más días disponibles
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  step >= s 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-muted-foreground"
                )}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 5 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-1",
                    step > s ? "bg-primary" : "bg-secondary"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Barber */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Selecciona tu barbero
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {barbers.map((barber) => (
                <Card
                  key={barber.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50",
                    formData.barberId === barber.id 
                      ? "border-primary bg-primary/10" 
                      : "border-border"
                  )}
                  onClick={() => handleSelectBarber(barber.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium text-foreground">{barber.name}</h4>
                    <p className="text-sm text-muted-foreground">{barber.specialty}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Date */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Selecciona la fecha
            </h3>
            
            {/* Horizontal scrollable date picker */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80"
                onClick={() => scrollDays('left')}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div 
                ref={scrollContainerRef}
                className="flex gap-3 overflow-x-auto py-4 px-10 scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {availableDays.map((date, index) => {
                  const { day, dayNum } = formatDate(date)
                  const isSelected = formData.date?.toDateString() === date.toDateString()
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectDate(date)}
                      className={cn(
                        "flex-shrink-0 w-16 py-3 rounded-lg border-2 transition-all text-center",
                        isSelected 
                          ? "border-primary bg-primary/20 text-foreground" 
                          : "border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="text-xs font-medium uppercase">{day}</div>
                      <div className="text-2xl font-bold">{dayNum}</div>
                    </button>
                  )
                })}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80"
                onClick={() => scrollDays('right')}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Select Time */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Selecciona el horario
            </h3>
            
            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-muted-foreground">Cargando horarios...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && handleSelectTime(slot.time)}
                    disabled={!slot.available}
                    className={cn(
                      "py-3 px-4 rounded-lg border-2 transition-all text-center font-medium",
                      !slot.available 
                        ? "border-border bg-secondary/50 text-muted-foreground cursor-not-allowed opacity-50" 
                        : formData.time === slot.time
                          ? "border-primary bg-primary/20 text-foreground"
                          : "border-border bg-card hover:border-primary/50 text-foreground"
                    )}
                  >
                    <div className="text-sm">{slot.time}</div>
                    <div className="text-xs mt-1 text-muted-foreground">
                      {slot.available ? 'Disponible' : 'Ocupado'}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(2)}>
                Atrás
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!canProceedToStep4}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Select Service */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">
              Selecciona el servicio
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50",
                    formData.service === service.id 
                      ? "border-primary bg-primary/10" 
                      : "border-border"
                  )}
                  onClick={() => handleSelectService(service.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-foreground">{service.name}</h4>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-primary font-bold">{formatPrice(service.price)}</div>
                        <div className="text-xs text-muted-foreground">{service.duration} min</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(3)}>
                Atrás
              </Button>
              <Button
                onClick={() => setStep(5)}
                disabled={!canProceedToStep5}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Contact Details & Confirm */}
        {step === 5 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-foreground">
              Confirma tu reserva
            </h3>
            
            {/* Summary */}
            <Card className="bg-secondary/30 border-primary/30">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barbero:</span>
                  <span className="text-foreground font-medium">
                    {barbers.find(b => b.id === formData.barberId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="text-foreground font-medium">
                    {formData.date?.toLocaleDateString('es-PY', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hora:</span>
                  <span className="text-foreground font-medium">{formData.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servicio:</span>
                  <span className="text-foreground font-medium">
                    {services.find(s => s.id === formData.service)?.name}
                  </span>
                </div>
                <div className="border-t border-border pt-2 mt-2 flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="text-primary font-bold text-lg">
                    {formatPrice(services.find(s => s.id === formData.service)?.price || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="clientName" className="text-foreground">Tu nombre</Label>
                <Input
                  id="clientName"
                  placeholder="Juan Pérez"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="mt-1 bg-card border-border"
                />
              </div>
              <div>
                <Label htmlFor="clientPhone" className="text-foreground">Tu WhatsApp</Label>
                <Input
                  id="clientPhone"
                  placeholder="+595 981 123456"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  className="mt-1 bg-card border-border"
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(4)}>
                Atrás
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!canConfirm || isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reservando...
                  </>
                ) : (
                  'Confirmar Reserva'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
