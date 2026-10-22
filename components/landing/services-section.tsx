'use client'

import { services, formatPrice } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

interface ServicesSectionProps {
  onBookingClick: () => void
}

export function ServicesSection({ onBookingClick }: ServicesSectionProps) {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nuestros Servicios
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestros servicios de barbería profesional. Cada servicio está diseñado para brindarte la mejor experiencia.
          </p>
        </div>
        
        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card 
              key={service.id}
              className="bg-card border-border hover:border-primary/50 transition-all duration-300 group"
            >
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-foreground mb-2">
                    {service.name}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mb-4 flex-grow">
                    {service.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-primary font-bold text-lg">
                      {formatPrice(service.price)}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Clock className="w-4 h-4" />
                      {service.duration} min
                    </span>
                  </div>
                  
                  <Button
                    onClick={onBookingClick}
                    className="w-full bg-secondary hover:bg-primary text-foreground hover:text-primary-foreground transition-all"
                  >
                    Reservar Turno
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">¿Listo para tu próximo corte?</p>
          <Button
            onClick={onBookingClick}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
          >
            Ver Agenda Completa
          </Button>
        </div>
      </div>
    </section>
  )
}
