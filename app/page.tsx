import { existsSync } from 'node:fs'
import path from 'node:path'
import { StudioHome } from '@/components/landing/studio-home'

// Filenames follow the six original photos supplied by the studio, in order.
const photos = [
  ['degradado-bajo', 'Degradado bajo con volumen en la nuca'],
  ['linea-lateral', 'Textura y línea de diseño lateral'],
  ['flequillo', 'Flequillo recto y sien degradada'],
  ['barba-perfilada', 'Corte corto con barba perfilada'],
  ['diseno', 'Degradado con diseño en la nuca'],
  ['plateado', 'Textura plateada sobre laterales degradados'],
]

export default function HomePage() {
  const work = photos.flatMap(([name, caption]) => {
    const image = ['webp', 'jpg', 'jpeg', 'png'].find(ext =>
      existsSync(path.join(process.cwd(), 'public', 'trabajos', name + '.' + ext)))
    return image ? [{ src: '/trabajos/' + name + '.' + image, caption }] : []
  })
  return <StudioHome work={work} />
}
