import Image from 'next/image'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

export const instagramUrl = 'https://www.instagram.com/durerichard10/'

export function Masthead({ onBookingClick, onNavigate }: { onBookingClick: () => void; onNavigate: (id: string) => void }) {
  return (
    <header className="masthead">
      <div className="studio-wrap masthead-inner">
        <a href="/" className="wordmark" aria-label="Richard Dure, inicio">
          <span className="monogram" aria-hidden="true">R<i>D</i></span>
          <span className="brand-small">Richard Dure<span>Barber Studio</span></span>
        </a>
        <nav aria-label="Principal" className="mast-nav">
          <a className="nav-text" href="#servicios" onClick={() => onNavigate('services-title')}>Servicios</a>
          <a className="nav-text" href="#trabajos" onClick={() => onNavigate('works-title')}>Trabajos</a>
          <button type="button" onClick={onBookingClick} className="nav-book">Reservar <ArrowUpRight size={15}/></button>
        </nav>
      </div>
    </header>
  )
}

export function HeroSection({ onBookingClick, featured }: { onBookingClick: () => void; featured?: { src: string; caption: string } }) {
  return (
    <section className="studio-hero" aria-labelledby="studio-title">
      <div className="studio-wrap hero-grid">
        <div className="hero-copy">
          <p className="studio-overline"><span aria-hidden="true" />Barbería de autor</p>
          <h1 id="studio-title">Richard <em>Dure</em></h1>
          <p className="hero-intro">Cortes clásicos, degradados y barba. Elegí tu servicio y encontrá tu próximo turno.</p>
          <div className="hero-actions">
            <button type="button" onClick={onBookingClick} className="primary-book">Reservá tu turno <ArrowRight strokeWidth={1.7} size={19} /></button>
            <a href="#trabajos" className="work-link">Ver trabajos <ArrowUpRight size={16} /></a>
          </div>
        </div>
        <div className="hero-art">
          <Image src={featured?.src ?? '/studio-tools.webp'} alt={featured?.caption ?? 'Composición editorial de una tijera de corte y un peine bajo la luz cálida.'} fill sizes="(max-width: 700px) 100vw, 53vw" priority />
        </div>
      </div>
    </section>
  )
}
