import { Card, CardContent } from '@/components/ui/card'
import { getTimeGreeting, getContextMessage } from '@/features/home-engine'
import type { ItfTodayState } from '@/interface/itfMeals'

interface WelcomeCardProps {
   name: string | null
   state: ItfTodayState
}

export const WelcomeCard = ({ name, state }: WelcomeCardProps) => {
   const hour = new Date().getHours()
   const greeting = getTimeGreeting(hour)
   const ctx = getContextMessage(state)

   return (
      <Card>
         <CardContent className='space-y-1 pt-6'>
            <p className='text-base font-medium text-foreground'>
               {greeting}
               {name ? `, ${name}` : ''} 👋
            </p>
            <p className='text-sm text-muted-foreground'>{ctx}</p>
         </CardContent>
      </Card>
   )
}
