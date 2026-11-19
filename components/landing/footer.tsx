import { ArrowUpRight, Instagram } from 'lucide-react'
import { instagramUrl } from './hero-section'

export function Footer() {
  return (
    <footer className="studio-footer">
      <div className="studio-wrap footer-inner">
        <div className="footer-sign">Richard <i>Dure</i></div>
        <a href={instagramUrl} target="_blank" rel="noreferrer"><Instagram size={16} /> @durerichard10 <ArrowUpRight size={14} /></a>
        <a href="/admin">Acceso al estudio <ArrowUpRight size={14} /></a>
      </div>
    </footer>
  )
}
