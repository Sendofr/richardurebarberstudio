'use client'

import { barbers } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'

interface BarbersSectionProps {
  onSelectBarber: (barberId: string) => void
}

export function BarbersSection({ onSelectBarber }: BarbersSectionProps) {
  return (
    <section className="py-20 px-4 bg-card/30">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nuestros Barberos
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Conoce a nuestro equipo de profesionales, cada uno con su estilo único y años de experiencia en el arte de la barbería.
          </p>
        </div>
        
        {/* Barbers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {barbers.map((barber) => (
            <Card 
              key={barber.id}
              className="bg-card border-border hover:border-primary/50 transition-all duration-300 group overflow-hidden"
            >
              <CardContent className="p-6">
                {/* Avatar placeholder */}
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center border-2 border-primary/30 group-hover:border-primary transition-colors">
                  <User className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                
                {/* Barber Info */}
                <div className="text-center">
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-foreground mb-1">
                    {barber.name}
                  </h3>
                  <p className="text-primary text-sm font-medium mb-3">
                    {barber.specialty}
                  </p>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    {barber.description}
                  </p>
                  
                  <Button
                    variant="outline"
                    onClick={() => onSelectBarber(barber.id)}
                    className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    Agendar con {barber.name.split(' ')[0]}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
