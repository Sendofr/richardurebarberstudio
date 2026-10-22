'use client'

import { useState } from 'react'
import { HeroSection } from '@/components/landing/hero-section'
import { BarbersSection } from '@/components/landing/barbers-section'
import { ServicesSection } from '@/components/landing/services-section'
import { BookingEngine } from '@/components/booking/booking-engine'
import { Footer } from '@/components/landing/footer'
import { WhatsAppButton } from '@/components/whatsapp-button'

export default function HomePage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [preSelectedBarberId, setPreSelectedBarberId] = useState<string | undefined>()

  const handleOpenBooking = () => {
    setPreSelectedBarberId(undefined)
    setIsBookingOpen(true)
    // Scroll to booking section
    setTimeout(() => {
      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSelectBarber = (barberId: string) => {
    setPreSelectedBarberId(barberId)
    setIsBookingOpen(true)
    // Scroll to booking section
    setTimeout(() => {
      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleCloseBooking = () => {
    setIsBookingOpen(false)
    setPreSelectedBarberId(undefined)
  }

  return (
    <main className="min-h-screen bg-background">
      <HeroSection onBookingClick={handleOpenBooking} />
      
      <BookingEngine 
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        preSelectedBarberId={preSelectedBarberId}
      />
      
      <BarbersSection onSelectBarber={handleSelectBarber} />
      
      <ServicesSection onBookingClick={handleOpenBooking} />
      
      <Footer />
      
      <WhatsAppButton />
    </main>
  )
}
