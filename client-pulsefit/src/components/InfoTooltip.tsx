import { useState } from 'react'
import { Info } from 'lucide-react'
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle
} from '@/components/ui/dialog'
import { cn } from '@/utils'

/**
 * Glosario de términos técnicos que aparecen en la app.
 * Mariana reportó que NO entendió kcal, macros, RPE, "media mañana",
 * "semana de descarga". Acá los explicamos en lenguaje simple LATAM.
 */
const GLOSSARY = {
   kcal: {
      title: '¿Qué son las kcal?',
      body: 'kcal y "calorías" son lo mismo — son las unidades con las que medimos cuánta energía te da la comida. Tu objetivo diario es la cantidad que necesitas para llegar a tu meta de peso. Si es bajar, las kcal serán menores que las que gastas; si es ganar, más.'
   },
   macros: {
      title: '¿Qué son los macros?',
      body: 'Son los 3 nutrientes que aportan energía: proteína (construye y mantiene músculo), carbos (energía rápida) y grasas (saciedad y hormonas). Aquí te los damos en gramos por día. No tienes que contarlos a mano — el plan ya viene cuadrado.'
   },
   protein: {
      title: 'Proteína',
      body: 'Construye y repara músculo. Viene de pollo, pescado, huevos, frijoles, lácteos. 1 pechuga de pollo mediana son ~60g de proteína. Cuando ves "98g proteína" en tu plan, es la suma de todo el día.'
   },
   carbs: {
      title: 'Carbohidratos',
      body: 'Energía principal del cuerpo. Vienen de arroz, papa, plátano, avena, pan. No son malos — sin carbos no rindes bien. El plan ya tiene la cantidad ideal para tu objetivo.'
   },
   fats: {
      title: 'Grasas',
      body: 'Saciedad + hormonas + absorber vitaminas. Vienen de aguacate, aceite de oliva, frutos secos, pescados grasos. Necesitas un mínimo todos los días — no son enemigas.'
   },
   rpe: {
      title: '¿Qué es RPE?',
      body: 'RPE es "Rate of Perceived Exertion" — qué tan duro sientes el ejercicio del 1 al 10. RPE 7 = podrías haber hecho 3 reps más. RPE 8 = 2 más. RPE 9 = 1 más. RPE 10 = imposible una más. Te pedimos esfuerzo medio (7) para crecer sin quemarte.'
   },
   deload: {
      title: '¿Qué es semana de descarga?',
      body: 'Cada 4-6 semanas bajamos un poco la intensidad para que el cuerpo absorba lo entrenado. No es una semana de descanso total — entrenas igual pero con menos peso/reps. Mejora resultados a largo plazo.'
   },
   tmb: {
      title: '¿Qué es TMB?',
      body: 'Tasa Metabólica Basal — las kcal que tu cuerpo quema solo por estar vivo (respirar, latir el corazón, mantener temperatura). Usamos la fórmula de Mifflin-St Jeor con tu edad, peso, altura y sexo.'
   },
   get: {
      title: '¿Qué es GET?',
      body: 'Gasto Energético Total — las kcal totales que quemás en un día, incluyendo tu actividad (caminar, trabajar, entrenar). Es tu TMB × un factor según qué tan activo seas.'
   },
   target_kcal: {
      title: '¿Cómo calculamos tu kcal objetivo?',
      body: 'Tomamos tu GET y le restamos calorías si tu meta es bajar de peso (déficit del 20%), o sumamos si es ganar. Nunca bajamos del mínimo seguro según tu sexo (1200 mujer / 1500 hombre).'
   }
} as const

export type InfoTopicKey = keyof typeof GLOSSARY

interface InfoTooltipProps {
   topic: InfoTopicKey
   className?: string
   /** Tamaño del ícono (default 12 = h-3 w-3). */
   size?: 12 | 14 | 16
}

/**
 * Botón discreto con un ícono de info que abre un dialog explicativo.
 * Mariana/Joaquín pueden tap'ear cualquier término técnico y entender qué significa.
 */
export const InfoTooltip = ({ topic, className, size = 12 }: InfoTooltipProps) => {
   const [open, setOpen] = useState(false)
   const entry = GLOSSARY[topic]
   const sizeClass = size === 16 ? 'h-4 w-4' : size === 14 ? 'h-3.5 w-3.5' : 'h-3 w-3'
   return (
      <>
         <button
            type='button'
            onClick={(e) => {
               e.stopPropagation()
               setOpen(true)
            }}
            aria-label={`Saber más sobre ${entry.title}`}
            className={cn(
               'inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground',
               className
            )}
         >
            <Info className={sizeClass} />
         </button>

         <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className='sm:max-w-md'>
               <DialogHeader>
                  <DialogTitle>{entry.title}</DialogTitle>
                  <DialogDescription className='pt-2 text-sm leading-relaxed text-foreground'>
                     {entry.body}
                  </DialogDescription>
               </DialogHeader>
            </DialogContent>
         </Dialog>
      </>
   )
}
