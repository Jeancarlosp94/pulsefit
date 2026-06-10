import {
   CartesianGrid,
   Legend,
   Line,
   LineChart,
   ResponsiveContainer,
   Tooltip,
   XAxis,
   YAxis
} from 'recharts'
import type { ItfWellbeingPoint } from '@/interface/itfProgress'

interface WellbeingChartProps {
   data: ItfWellbeingPoint[]
}

export const WellbeingChart = ({ data }: WellbeingChartProps) => {
   if (data.length < 2) {
      return (
         <p className='py-6 text-center text-xs text-muted-foreground'>
            Registra tu ánimo unos días más y vemos tu tendencia 🌿
         </p>
      )
   }

   return (
      <div className='h-48 w-full'>
         <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
               <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
               <XAxis
                  dataKey='date'
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 10 }}
                  stroke='currentColor'
                  className='text-muted-foreground'
               />
               <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 10 }}
                  stroke='currentColor'
                  className='text-muted-foreground'
               />
               <Tooltip
                  contentStyle={{
                     fontSize: 12,
                     borderRadius: 6,
                     border: '1px solid hsl(var(--border))',
                     backgroundColor: 'hsl(var(--background))'
                  }}
                  labelFormatter={(v) => `Día ${v}`}
               />
               <Legend wrapperStyle={{ fontSize: 11 }} />
               <Line
                  type='monotone'
                  dataKey='energy'
                  name='Energía'
                  stroke='hsl(var(--primary))'
                  strokeWidth={2}
                  dot={{ r: 2 }}
               />
               <Line
                  type='monotone'
                  dataKey='mood'
                  name='Ánimo'
                  stroke='hsl(var(--accent))'
                  strokeWidth={2}
                  dot={{ r: 2 }}
               />
            </LineChart>
         </ResponsiveContainer>
      </div>
   )
}
