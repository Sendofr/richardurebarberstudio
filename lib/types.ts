export interface Barber {
  id: string
  name: string
  specialty: string
  image: string
  description: string
}

export interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number // in minutes
}

export interface TimeSlot {
  time: string
  available: boolean
}

export interface Booking {
  id: string
  barberId: string
  barberName: string
  clientName: string
  clientPhone: string
  date: string
  time: string
  service: string
  status: 'confirmed' | 'cancelled' | 'completed'
  createdAt: string
}

export interface BookingFormData {
  barberId: string
  date: Date | undefined
  time: string
  service: string
  clientName: string
  clientPhone: string
}
