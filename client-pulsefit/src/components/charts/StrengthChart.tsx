import {
   CartesianGrid,
   Line,
   LineChart,
   ResponsiveContainer,
   Tooltip,
   XAxis,
   YAxis
} from 'recharts'
import type { ItfStrengthProgressPoint } from '@/interface/itfProgress'

interface StrengthChartProps {
   exercise: ItfStrengthProgressPoint
}

export const StrengthChart = ({ exercise }: StrengthChartProps) => {
   if (exercise.history.length < 2) {
      return (
         <p className='py-3 text-center text-xs text-muted-foreground'>
            Aún pocos registros — sigue entrenando 💪
         </p>
      )
   }

   return (
      <div className='h-36 w-full'>
         <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={exercise.history} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
               <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
               <XAxis
                  dataKey='date'
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 10 }}
                  stroke='currentColor'
                  className='text-muted-foreground'
               />
               <YAxis
                  tick={{ fontSize: 10 }}
                  stroke='currentColor'
                  className='text-muted-foreground'
               />
               <Tooltip
                  contentStyle={{
                     fontSize: 11,
                     borderRadius: 6,
                     border: '1px solid hsl(var(--border))',
                     backgroundColor: 'hsl(var(--background))'
                  }}
                  formatter={(value) => [`${value} kg`, 'Carga']}
               />
               <Line
                  type='monotone'
                  dataKey='weight_kg'
                  stroke='hsl(var(--primary))'
                  strokeWidth={2}
                  dot={{ r: 2 }}
               />
            </LineChart>
         </ResponsiveContainer>
      </div>
   )
}
