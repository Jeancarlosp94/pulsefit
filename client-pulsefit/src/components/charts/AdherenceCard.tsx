import { Flame, Calendar, Salad, Dumbbell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utils'
import type { ItfAdherenceSummary } from '@/interface/itfProgress'

interface AdherenceCardProps {
   data: ItfAdherenceSummary
}

interface StatProps {
   icon: React.ComponentType<{ className?: string }>
   label: string
   value: string | number
   accent?: boolean
}

const Stat = ({ icon: Icon, label, value, accent }: StatProps) => (
   <div className='space-y-1 rounded-md border border-border bg-background p-3 text-center'>
      <Icon className={cn('mx-auto h-4 w-4', accent ? 'text-primary' : 'text-muted-foreground')} />
      <p className='text-lg font-medium tabular-nums'>{value}</p>
      <p className='text-[10px] text-muted-foreground'>{label}</p>
   </div>
)

export const AdherenceCard = ({ data }: AdherenceCardProps) => (
   <Card>
      <CardHeader className='pb-3'>
         <CardTitle className='text-base'>Tu mes</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
         <div className='grid grid-cols-2 gap-2'>
            <Stat
               icon={Flame}
               label='Días seguidos'
               value={data.current_streak}
               accent={data.current_streak > 0}
            />
            <Stat icon={Calendar} label='Días activos / 30' value={data.active_days_30} />
            <Stat icon={Salad} label='Comidas registradas' value={`${data.meals_adherence_pct}%`} />
            <Stat icon={Dumbbell} label='Entrenos esta semana' value={data.workouts_last_week} />
         </div>
         <p className='text-center text-xs text-muted-foreground'>
            La consistencia importa más que la perfección 🌿
         </p>
      </CardContent>
   </Card>
)
