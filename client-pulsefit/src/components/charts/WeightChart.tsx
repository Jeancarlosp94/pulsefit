import {
   CartesianGrid,
   Line,
   LineChart,
   ResponsiveContainer,
   Tooltip,
   XAxis,
   YAxis
} from 'recharts'
import type { ItfWeightPoint } from '@/interface/itfProgress'

interface WeightChartProps {
   data: ItfWeightPoint[]
}

export const WeightChart = ({ data }: WeightChartProps) => {
   if (data.length < 2) {
      return (
         <p className='py-6 text-center text-xs text-muted-foreground'>
            Necesitamos al menos 2 registros para mostrar tu tendencia 🌿
         </p>
      )
   }

   const min = Math.floor(Math.min(...data.map((d) => d.weight_kg)) - 1)
   const max = Math.ceil(Math.max(...data.map((d) => d.weight_kg)) + 1)

   return (
      <div className='h-48 w-full'>
         <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
               <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
               <XAxis
                  dataKey='date'
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 10 }}
                  stroke='currentColor'
                  className='text-muted-foreground'
               />
               <YAxis
                  domain={[min, max]}
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
                  formatter={(value) => [`${value} kg`, 'Peso']}
               />
               <Line
                  type='monotone'
                  dataKey='weight_kg'
                  stroke='hsl(var(--primary))'
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
               />
            </LineChart>
         </ResponsiveContainer>
      </div>
   )
}
