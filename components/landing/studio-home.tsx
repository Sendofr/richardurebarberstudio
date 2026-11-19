'use client'

import { useRef, useState } from 'react'
import { HeroSection, Masthead } from '@/components/landing/hero-section'
import { ServicesSection } from '@/components/landing/services-section'
import { BookingEngine } from '@/components/booking/booking-engine'
import { Footer } from '@/components/landing/footer'
import { Instagram, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import { instagramUrl } from './hero-section'

export function StudioHome({ work }: { work: { src: string; caption: string }[] }) {
  const [booking, setBooking] = useState<{ serviceId?: string } | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  function openBooking(serviceId?: string) {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setBooking({ serviceId })
  }
  function closeBooking() {
    setBooking(null)
    requestAnimationFrame(() => trigger.current?.focus())
  }

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <Masthead onBookingClick={() => {
        if (booking) document.getElementById('booking-title')?.focus()
        else openBooking()
      }} onNavigate={id => {
        setBooking(null)
        requestAnimationFrame(() => document.getElementById(id)?.focus())
      }} />
      <main id="contenido">
        {booking && (
          <BookingEngine isOpen onClose={closeBooking} preSelectedServiceId={booking.serviceId} />
        )}
        <div hidden={Boolean(booking)}>
            <HeroSection onBookingClick={() => openBooking()} featured={work.at(-1)} />
            <ServicesSection onBookingClick={openBooking} />
            <section id="trabajos" aria-labelledby="works-title" className="studio-wrap work-section">
              <div className="work-heading">
                <div>
                  <p className="studio-overline"><span aria-hidden="true" />Portafolio</p>
                  <h2 tabIndex={-1} id="works-title">Trabajos de Richard</h2>
                </div>
                <a className="work-link" href={instagramUrl} target="_blank" rel="noreferrer"><Instagram size={16} /> Ver en Instagram <ArrowUpRight size={14} /></a>
              </div>
              {work.length ? <div className="work-gallery">{work.map(photo => (
                <figure key={photo.src}><Image src={photo.src} alt={photo.caption} width={720} height={960} sizes="(max-width: 620px) 48vw, 30vw" /><figcaption>{photo.caption}</figcaption></figure>
              ))}</div> : <p className="portfolio-note">Degradados bajos, líneas de diseño y textura. Explorá los cortes de Richard en su perfil.</p>}
            </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
