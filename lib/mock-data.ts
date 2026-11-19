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
    description: 'Forma clásica, contornos limpios y terminación a tijera.',
    price: 50000,
    duration: 30
  },
  {
    id: '2',
    name: 'Degradado / Fade',
    description: 'Transición gradual en los laterales y la nuca.',
    price: 60000,
    duration: 45
  },
  {
    id: '3',
    name: 'Barba Clásica',
    description: 'Recorte, definición del contorno y perfilado de barba.',
    price: 40000,
    duration: 25
  },
  {
    id: '4',
    name: 'Combo Corte + Barba',
    description: 'Corte de pelo y perfilado de barba en el mismo turno.',
    price: 90000,
    duration: 60
  },
  {
    id: '5',
    name: 'Perfilado de Cejas',
    description: 'Definición de cejas con navaja.',
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

// Calendar dates in the studio, even when a client books from another time zone.
export function getNextDays(count: number): Date[] {
  const days: Date[] = []
  const shopDay = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Asuncion', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  const cursor = new Date(shopDay + 'T12:00:00')
  while (days.length < count) {
    if (cursor.getDay() !== 0) days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
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
