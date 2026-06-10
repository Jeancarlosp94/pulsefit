import { generateWorkoutRescue } from './workout-rescues'
import { generateMealRescue } from './meal-rescues'
import { generateEmotionalRescue } from './emotional-rescues'
import type { ItfRescueRequest, ItfRescueResponse } from './types'

export * from './types'

/**
 * Router de rescates. Toma una request y devuelve la respuesta del
 * dominio correspondiente. Mantenemos el motor 100% determinístico
 * (sin IA) para garantizar tono y opciones validadas por especialistas.
 */
export const generateRescue = (req: ItfRescueRequest): ItfRescueResponse => {
   switch (req.domain) {
      case 'workout':
         return generateWorkoutRescue(req)
      case 'meal':
         return generateMealRescue(req)
      case 'emotional':
         return generateEmotionalRescue(req)
   }
}
