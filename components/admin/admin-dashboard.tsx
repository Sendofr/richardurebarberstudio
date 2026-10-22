'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/mock-data'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { 
  Scissors, 
  LogOut, 
  Calendar, 
  Clock, 
  User as UserIcon, 
  Phone, 
  XCircle, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Turno {
  id: string
  fecha: string
  hora: string
  barbero_id: number
  cliente_nombre: string
  cliente_telefono: string
  servicio: string | null
  estado: 'pendiente' | 'confirmado' | 'cancelado' | 'bloqueado'
  created_at: string
  barberos: {
    nombre: string
  } | null
}

interface Barbero {
  id: number
  nombre: string
  especialidad: string
  foto_url: string | null
  auth_user_id: string | null
  created_at: string
}

interface AdminDashboardProps {
  user: User
  onLogout: () => void
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [currentBarber, setCurrentBarber] = useState<Barbero | null>(null)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [selectedDate] = useState(new Date())
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  
  const supabase = createClient()
  
  const todayStr = selectedDate.toISOString().split('T')[0]
  
  // Fetch current barber profile
  const fetchCurrentBarber = useCallback(async () => {
    if (!user?.id) return
    
    const { data, error } = await supabase
      .from('barberos')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()
    
    if (error) {
      console.error('[v0] Error fetching barber profile:', error)
      toast.error('Error al cargar tu perfil', {
        description: error.message,
      })
      return
    }
    
    if (data) {
      setCurrentBarber(data)
    }
  }, [user?.id, supabase])
  
  const fetchTurnos = useCallback(async () => {
    if (!currentBarber?.id) return
    
    setIsLoading(true)
    
    const { data, error } = await supabase
      .from('turnos')
      .select('*, barberos(nombre)')
      .eq('fecha', todayStr)
      .eq('barbero_id', currentBarber.id)
      .order('hora', { ascending: true })
    
    if (error) {
      toast.error('Error al cargar turnos', {
        description: error.message,
      })
      setIsLoading(false)
      return
    }
    
    setTurnos(data || [])
    setIsLoading(false)
  }, [supabase, todayStr, currentBarber?.id])
  
  useEffect(() => {
    fetchCurrentBarber()
  }, [fetchCurrentBarber])
  
  useEffect(() => {
    if (currentBarber?.id) {
      fetchTurnos()
    }
  }, [fetchTurnos, currentBarber?.id])
  
  const confirmedTurnos = turnos.filter(t => t.estado === 'confirmado')
  const cancelledTurnos = turnos.filter(t => t.estado === 'cancelado')

  const handleCancelTurno = async (turnoId: string) => {
    setIsUpdating(turnoId)
    
    const { error } = await supabase
      .from('turnos')
      .update({ estado: 'cancelado' })
      .eq('id', turnoId)
    
    if (error) {
      toast.error('Error al cancelar turno', {
        description: error.message,
      })
      setIsUpdating(null)
      return
    }
    
    // Update local state
    setTurnos(prev => 
      prev.map(turno => 
        turno.id === turnoId 
          ? { ...turno, estado: 'cancelado' as const }
          : turno
      )
    )
    
    toast.success('Turno cancelado', {
      description: 'El horario ha sido liberado y está disponible nuevamente.',
    })
    setIsUpdating(null)
  }

  const handleRestoreTurno = async (turnoId: string) => {
    setIsUpdating(turnoId)
    
    const { error } = await supabase
      .from('turnos')
      .update({ estado: 'confirmado' })
      .eq('id', turnoId)
    
    if (error) {
      toast.error('Error al restaurar turno', {
        description: error.message,
      })
      setIsUpdating(null)
      return
    }
    
    // Update local state
    setTurnos(prev => 
      prev.map(turno => 
        turno.id === turnoId 
          ? { ...turno, estado: 'confirmado' as const }
          : turno
      )
    )
    
    toast.success('Turno restaurado', {
      description: 'El turno ha sido confirmado nuevamente.',
    })
    setIsUpdating(null)
  }

  // Available time slots for blocking
  const allTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '14:00', '14:30', '15:00', '15:30', '16:00',
    '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
  ]

  // Get occupied times from today's turnos
  const occupiedTimes = turnos
    .filter(t => t.estado !== 'cancelado')
    .map(t => t.hora.slice(0, 5))

  const handleBlockHorario = async (horaBloqueo: string) => {
    if (!currentBarber?.id) return

    setIsUpdating('block-' + horaBloqueo)

    const { error } = await supabase.from('turnos').insert([{
      barbero_id: currentBarber.id,
      fecha: todayStr,
      hora: horaBloqueo + ':00',
      cliente_nombre: 'BLOQUEADO',
      cliente_telefono: 'N/A',
      estado: 'bloqueado'
    }])

    if (error) {
      toast.error('Error al bloquear horario', {
        description: error.message?.includes('duplicate') || error.message?.includes('unique')
          ? 'Este horario ya está ocupado o bloqueado.'
          : error.message,
      })
      setIsUpdating(null)
      return
    }

    toast.success('Horario bloqueado', {
      description: `El horario de ${horaBloqueo} ha sido bloqueado en tu agenda.`,
    })
    
    setIsBlockModalOpen(false)
    fetchTurnos()
    setIsUpdating(null)
  }

  const handleUnblockHorario = async (turnoId: string) => {
    setIsUpdating(turnoId)
    
    const { error } = await supabase
      .from('turnos')
      .delete()
      .eq('id', turnoId)
    
    if (error) {
      toast.error('Error al desbloquear horario', {
        description: error.message,
      })
      setIsUpdating(null)
      return
    }
    
    // Update local state
    setTurnos(prev => prev.filter(turno => turno.id !== turnoId))
    
    toast.success('Horario desbloqueado', {
      description: 'El horario ha sido liberado y está disponible nuevamente.',
    })
    setIsUpdating(null)
  }

  const { day, dayNum, month } = formatDate(selectedDate)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
            <CardTitle className="text-foreground">
              {currentBarber ? `Bienvenido al panel, ${currentBarber.nombre}` : 'Panel de Administración'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {currentBarber?.especialidad && `${currentBarber.especialidad} • `}
              {user.email}
            </CardDescription>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="border-border hover:border-destructive hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{turnos.length}</p>
                <p className="text-sm text-muted-foreground">Turnos Hoy</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{confirmedTurnos.length}</p>
                <p className="text-sm text-muted-foreground">Confirmados</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/20">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{cancelledTurnos.length}</p>
                <p className="text-sm text-muted-foreground">Cancelados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Date */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Calendar className="w-5 h-5 text-primary" />
                  Turnos del Día
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {day} {dayNum} de {month}, {selectedDate.getFullYear()}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTurnos}
                disabled={isLoading}
                className="border-border"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                Actualizar
              </Button>
              <Button
                size="sm"
                onClick={() => setIsBlockModalOpen(true)}
                disabled={isUpdating !== null}
                variant="secondary"
                className="bg-secondary hover:bg-secondary/80"
              >
                Bloquear Horario
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Bookings List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <RefreshCw className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-foreground font-medium">Cargando turnos...</p>
              </CardContent>
            </Card>
          ) : turnos.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-medium">No hay turnos para hoy</p>
                <p className="text-sm text-muted-foreground">Los nuevos turnos aparecerán aquí</p>
              </CardContent>
            </Card>
          ) : (
            turnos.map((turno) => (
              <Card 
                key={turno.id}
                className={cn(
                  "bg-card border-border transition-all",
                  turno.estado === 'cancelado' && "opacity-60"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Time & Service */}
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-16 h-16 rounded-lg flex flex-col items-center justify-center",
                        turno.estado === 'cancelado' 
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/20 text-primary"
                      )}>
                        <Clock className="w-4 h-4 mb-1" />
                        <span className="font-bold text-sm">{turno.hora.slice(0, 5)}</span>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-foreground text-lg">
                          {turno.cliente_nombre}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {turno.cliente_telefono}
                          </span>
                          {turno.servicio && (
                            <span className="flex items-center gap-1">
                              <Scissors className="w-3 h-3" />
                              {turno.servicio}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Status & Actions */}
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        turno.estado === 'confirmado' 
                          ? "bg-green-500/20 text-green-500"
                          : turno.estado === 'cancelado'
                            ? "bg-destructive/20 text-destructive"
                            : turno.estado === 'pendiente'
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-blue-500/20 text-blue-500"
                      )}>
                        {turno.estado === 'confirmado' ? 'Confirmado' : 
                         turno.estado === 'cancelado' ? 'Cancelado' : 
                         turno.estado === 'pendiente' ? 'Pendiente' : 'Bloqueado'}
                      </span>
                      
                      {(turno.estado === 'confirmado' || turno.estado === 'pendiente') ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelTurno(turno.id)}
                          disabled={isUpdating === turno.id}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          {isUpdating === turno.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </Button>
                      ) : turno.estado === 'cancelado' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestoreTurno(turno.id)}
                          disabled={isUpdating === turno.id}
                          className="text-muted-foreground hover:text-green-500"
                        >
                          {isUpdating === turno.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </Button>
                      ) : turno.estado === 'bloqueado' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnblockHorario(turno.id)}
                          disabled={isUpdating === turno.id}
                          className="text-muted-foreground hover:text-blue-500"
                          title="Desbloquear horario"
                        >
                          {isUpdating === turno.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Block Time Modal */}
      <Dialog open={isBlockModalOpen} onOpenChange={setIsBlockModalOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Bloquear Horario</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Selecciona un horario disponible para bloquear en tu agenda de hoy.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-3 py-4">
            {allTimeSlots.map((time) => {
              const isOccupied = occupiedTimes.includes(time)
              const isBlocking = isUpdating === 'block-' + time
              
              return (
                <button
                  key={time}
                  onClick={() => !isOccupied && handleBlockHorario(time)}
                  disabled={isOccupied || isUpdating !== null}
                  className={cn(
                    "py-3 px-4 rounded-lg border-2 transition-all text-center font-medium",
                    isOccupied 
                      ? "border-border bg-secondary/50 text-muted-foreground cursor-not-allowed opacity-50" 
                      : "border-border bg-card hover:border-primary hover:bg-primary/10 text-foreground"
                  )}
                >
                  <div className="text-sm">{time}</div>
                  <div className="text-xs mt-1 text-muted-foreground">
                    {isBlocking ? 'Bloqueando...' : isOccupied ? 'Ocupado' : 'Disponible'}
                  </div>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
