'use client'

import { Scissors, MapPin, Phone, Clock } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scissors className="w-6 h-6 text-primary" />
              <span className="font-[family-name:var(--font-playfair)] text-xl font-bold text-foreground">
                Lohse Barber
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tu barbería premium en Encarnación. Experiencia y estilo en cada corte.
            </p>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Contacto</h4>
            <div className="space-y-3">
              <a 
                href="tel:+595981123456" 
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                +595 981 123 456
              </a>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                Av. Mariscal López 123, Encarnación
              </div>
            </div>
          </div>
          
          {/* Hours */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Horarios</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Lun - Vie: 9:00 - 20:00</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Sábados: 9:00 - 18:00</span>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <Clock className="w-4 h-4" />
                <span>Domingos: Cerrado</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Lohse Barber. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
