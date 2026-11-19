import { ArrowUpRight } from 'lucide-react'
import { services } from '@/lib/mock-data'

export function ServicesSection({ onBookingClick }: { onBookingClick: (serviceId: string) => void }) {
  return (
    <section id="servicios" className="services-paper" aria-labelledby="services-title">
      <div className="studio-wrap">
        <div className="services-lead">
          <div>
            <p className="studio-overline"><span aria-hidden="true" />La carta</p>
            <h2 id="services-title" tabIndex={-1}>Servicios<span>.</span></h2>
          </div>
          <p>Elegí un servicio para consultar<br className="desktop-break" /> los turnos disponibles.</p>
        </div>
        <ul className="service-list">
          {services.map(service => (
            <li key={service.id}>
              <button type="button" onClick={() => onBookingClick(service.id)} aria-label={`Reservar ${service.name}`}>
                <span className="service-name">{service.name}</span>
                <span className="service-desc">{service.description}</span>
                <span className="service-arrow" aria-hidden="true"><ArrowUpRight size={19} /></span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
