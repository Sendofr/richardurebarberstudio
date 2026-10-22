'use client'

import { Button } from '@/components/ui/button'
import { Scissors } from 'lucide-react'

interface HeroSectionProps {
  onBookingClick: () => void
}

export function HeroSection({ onBookingClick }: HeroSectionProps) {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 border border-primary/20 rounded-full opacity-30" />
      <div className="absolute bottom-20 right-10 w-48 h-48 border border-primary/10 rounded-full opacity-20" />
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full border-2 border-primary/50 bg-card">
            <Scissors className="w-10 h-10 text-primary" />
          </div>
        </div>
        
        {/* Main Title */}
        <h1 className="font-[family-name:var(--font-playfair)] text-5xl md:text-7xl font-bold text-foreground mb-4 tracking-tight">
          LOHSE BARBER
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-primary font-medium mb-2 tracking-widest uppercase">
          Creando tu estilo
        </p>
        
        <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
          Los mejores cortes de Encarnación. Experiencia premium, resultados impecables.
        </p>
        
        {/* CTA Button */}
        <Button 
          onClick={onBookingClick}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg px-10 py-6 rounded-full transition-all duration-300 hover:scale-105 shadow-lg shadow-primary/20"
        >
          Reservar Turno
        </Button>
        
        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>+5 años de experiencia</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>+10,000 cortes realizados</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Reserva online 24/7</span>
          </div>
        </div>
      </div>
    </section>
  )
}
