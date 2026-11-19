import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import './studio.css'

export const metadata: Metadata = {
  title: { default: 'Richard Dure · Barber Studio', template: '%s · Richard Dure' },
  description: 'Elegí tu servicio de barbería y reservá tu turno con Richard Dure.',
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = { themeColor: '#191915', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-PY" className="dark bg-background">
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
