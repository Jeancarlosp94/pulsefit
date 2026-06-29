import { Sparkles, TrendingDown, Heart, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * "Reality check" educativo pre-plan.
 * Normaliza expectativas reales sobre tiempos y pesa la cultura del "milagro
 * en 2 semanas". Aparece en el Step 7 (review) antes del summary numérico.
 *
 * Tono firmado por Lucía + Valentina: ni catastrofista ni dulzón. Realismo
 * cálido. Tres verdades simples.
 */
export const RealityCheckCard = () => (
   <Card className='border-secondary/30 bg-secondary/5'>
      <CardHeader className='pb-2'>
         <CardTitle className='flex items-center gap-2 text-sm'>
            <Sparkles className='h-4 w-4 text-secondary' />
            Antes de empezar, 3 verdades 🌿
         </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
         <div className='flex gap-3'>
            <TrendingDown className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
            <div>
               <p className='font-medium'>Bajar peso saludable = 0.5 a 1% por semana</p>
               <p className='text-xs text-muted-foreground'>
                  Por encima de eso pierdes músculo y energía, no grasa. Las apps que prometen 10 kg
                  en 1 mes te están mintiendo.
               </p>
            </div>
         </div>

         <div className='flex gap-3'>
            <Calendar className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
            <div>
               <p className='font-medium'>Los cambios visibles toman 8-12 semanas</p>
               <p className='text-xs text-muted-foreground'>
                  Tu cuerpo no es Photoshop. La consistencia importa más que la perfección. Si te
                  saltas un día, no perdiste nada — sigues mañana.
               </p>
            </div>
         </div>

         <div className='flex gap-3'>
            <Heart className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
            <div>
               <p className='font-medium'>Las pesas NO te ponen "musculoso"</p>
               <p className='text-xs text-muted-foreground'>
                  Para mujeres sin esteroides es biológicamente improbable. Las pesas tonifican,
                  fortalecen y protegen tus huesos. El "modo cardio para no engordar" es un mito.
               </p>
            </div>
         </div>

         <p className='border-t border-border pt-3 text-center text-[10px] italic text-muted-foreground'>
            "La consistencia importa más que la perfección" 🌱
         </p>
      </CardContent>
   </Card>
)
