import { Barber, Service, Booking, TimeSlot } from './types'

export const barbers: Barber[] = [
  {
    id: '1',
    name: 'Carlos Lohse',
    specialty: 'Degradados y estilos modernos',
    image: '/barbers/carlos.jpg',
    description: 'Fundador de Lohse Barber. Especialista en degradados perfectos y cortes con texturas.'
  },
  {
    id: '2',
    name: 'Miguel Fernández',
    specialty: 'Barba clásica y perfilados',
    image: '/barbers/miguel.jpg',
    description: 'Maestro en el arte de la barba. Perfilados con navaja que marcan la diferencia.'
  },
  {
    id: '3',
    name: 'Diego Ramírez',
    specialty: 'Cortes creativos y diseños',
    image: '/barbers/diego.jpg',
    description: 'Si buscás algo único, él es tu barbero. Diseños personalizados y cortes de tendencia.'
  }
]

export const services: Service[] = [
  {
    id: '1',
    name: 'Corte Clásico',
    description: 'Corte tradicional con acabados profesionales',
    price: 50000,
    duration: 30
  },
  {
    id: '2',
    name: 'Degradado / Fade',
    description: 'Desde skin fade hasta degradados suaves',
    price: 60000,
    duration: 45
  },
  {
    id: '3',
    name: 'Barba Clásica',
    description: 'Perfilado con navaja y acabado perfecto',
    price: 40000,
    duration: 25
  },
  {
    id: '4',
    name: 'Combo Corte + Barba',
    description: 'El pack completo para el caballero moderno',
    price: 90000,
    duration: 60
  },
  {
    id: '5',
    name: 'Perfilado de Cejas',
    description: 'Definición perfecta con navaja',
    price: 20000,
    duration: 15
  }
]

// Mock bookings for admin panel
export const mockBookings: Booking[] = [
  {
    id: '1',
    barberId: '1',
    barberName: 'Carlos Lohse',
    clientName: 'Juan Pérez',
    clientPhone: '+595 981 123456',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    service: 'Degradado / Fade',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    barberId: '1',
    barberName: 'Carlos Lohse',
    clientName: 'Pedro González',
    clientPhone: '+595 982 654321',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    service: 'Combo Corte + Barba',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    barberId: '1',
    barberName: 'Carlos Lohse',
    clientName: 'Luis Martínez',
    clientPhone: '+595 983 789012',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    service: 'Corte Clásico',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  }
]

// All available time slots
export const ALL_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '14:00', '14:30', '15:00', '15:30', '16:00',
  '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
]

// Generate time slots for a given date (sync version for initial render)
export function generateTimeSlots(date: Date, barberId: string, occupiedSlots: string[] = []): TimeSlot[] {
  const slots: TimeSlot[] = []
  
  ALL_TIME_SLOTS.forEach(time => {
    const isOccupied = occupiedSlots.includes(time)
    slots.push({
      time,
      available: !isOccupied
    })
  })
  
  return slots
}

// Format price in Guaranies
export function formatPrice(price: number): string {
  return `Gs. ${price.toLocaleString('es-PY')}`
}

// Get next N days starting from today
export function getNextDays(count: number): Date[] {
  const days: Date[] = []
  const today = new Date()
  
  for (let i = 0; i < count; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    // Skip Sundays
    if (date.getDay() !== 0) {
      days.push(date)
    } else {
      count++ // Add one more day to compensate for skipped Sunday
    }
  }
  
  return days.slice(0, count)
}

// Format date for display
export function formatDate(date: Date): { day: string; dayNum: number; month: string } {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  
  return {
    day: days[date.getDay()],
    dayNum: date.getDate(),
    month: months[date.getMonth()]
  }
}
