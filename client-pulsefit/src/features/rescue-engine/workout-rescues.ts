import type {
   ItfRescueAlternative,
   ItfRescueRequest,
   ItfRescueResponse,
   ItfWorkoutTrigger
} from './types'

/** Catálogo de alternativas por trigger de entrenamiento. */
const ALTERNATIVES: Record<ItfWorkoutTrigger, ItfRescueAlternative[]> = {
   no_time: [
      {
         id: 'wk_no_time_express',
         title: 'Rutina exprés 15 min',
         description: 'Versión corta: 3 ejercicios compuestos sin descansos largos. Cubre el 70%.',
         icon: '⚡',
         action_label: 'Hacer exprés'
      },
      {
         id: 'wk_no_time_walk',
         title: 'Caminata 20 min',
         description: 'Camina rápido al menos 20 minutos. Cuenta como actividad y baja estrés.',
         icon: '🚶',
         action_label: 'Salir a caminar'
      },
      {
         id: 'wk_no_time_skip',
         title: 'Día libre con compensación',
         description:
            'Hoy descansas. Mañana volvemos sin sumar deuda. La recuperación es parte del plan.',
         icon: '🌿',
         action_label: 'Día libre'
      }
   ],
   no_energy: [
      {
         id: 'wk_no_energy_walk',
         title: 'Caminata suave 20 min',
         description: 'Sin forzar. Caminar despeja la cabeza y enciende energía gradual.',
         icon: '🚶',
         action_label: 'Caminar'
      },
      {
         id: 'wk_no_energy_stretch',
         title: 'Solo estiramientos 15 min',
         description: 'Movilidad y respiración. Tu cuerpo lo agradece más que forzarlo cansado.',
         icon: '🧘',
         action_label: 'Estirar'
      },
      {
         id: 'wk_no_energy_rest',
         title: 'Descanso completo',
         description: 'Hoy escuchaste a tu cuerpo. Eso es entrenar inteligente, no flojera.',
         icon: '😴',
         action_label: 'Descansar'
      }
   ],
   low_mood: [
      {
         id: 'wk_low_mood_micro',
         title: 'Micro-sesión 10 min',
         description: '10 minutos algo simple que disfrutes. No tiene que ser intenso.',
         icon: '💪',
         action_label: 'Mover 10 min'
      },
      {
         id: 'wk_low_mood_walk',
         title: 'Caminata al aire libre',
         description: 'Sol + movimiento + algo de música. Comprobado que sube el ánimo.',
         icon: '☀️',
         action_label: 'Salir'
      },
      {
         id: 'wk_low_mood_rest',
         title: 'Cuida tu día',
         description: 'Está bien parar. Volvemos cuando estés. Sin presión.',
         icon: '🤍',
         action_label: 'Pausa'
      }
   ],
   away_from_home: [
      {
         id: 'wk_away_bodyweight',
         title: 'Rutina sin equipo',
         description: 'Solo peso corporal: sentadillas, lagartijas, plancha. 20 min y listo.',
         icon: '🏋️',
         action_label: 'Bodyweight'
      },
      {
         id: 'wk_away_hotel',
         title: 'Hotel/cuarto chico',
         description: 'Circuito de 6 ejercicios en 1 m². Sin saltos para no molestar al vecino.',
         icon: '🏨',
         action_label: 'Cuarto chico'
      },
      {
         id: 'wk_away_walk',
         title: 'Explorar caminando',
         description: 'Conoces el lugar y sumas movimiento. 30 min activos.',
         icon: '🗺️',
         action_label: 'Caminar y explorar'
      }
   ],
   injury: [
      {
         id: 'wk_injury_alt',
         title: 'Entreno evitando esa zona',
         description:
            'Te armamos algo que no involucre la zona molesta. Lo demás sigue funcionando.',
         icon: '🛡️',
         action_label: 'Rutina adaptada'
      },
      {
         id: 'wk_injury_mobility',
         title: 'Movilidad de la zona',
         description: 'Movimientos suaves específicos. Si duele, paras. La paciencia es músculo.',
         icon: '🧘',
         action_label: 'Movilidad'
      },
      {
         id: 'wk_injury_rest',
         title: 'Reposo total',
         description: 'Si te lo recomienda alguien, hazlo. El cuerpo sana cuando lo dejas.',
         icon: '🩹',
         action_label: 'Reposar'
      }
   ]
}

const INTRO_BY_TRIGGER: Record<ItfWorkoutTrigger, string> = {
   no_time: 'Sin tiempo hoy. Tenemos 3 opciones que sí caben en tu día 🌿',
   no_energy: 'Sin energía es señal real, no excusa. Estas 3 opciones respetan eso:',
   low_mood: 'Estos días pasan. Ninguna de estas opciones te exige rendir alto:',
   away_from_home: 'Fuera de casa también se puede. Elige la que mejor calce hoy:',
   injury:
      'Antes de seguir: si duele fuerte, mejor consulta. Mientras, estas opciones cuidan la zona:'
}

export const generateWorkoutRescue = (req: ItfRescueRequest): ItfRescueResponse => {
   const trigger = req.trigger as ItfWorkoutTrigger
   return {
      domain: 'workout',
      trigger,
      intro: INTRO_BY_TRIGGER[trigger],
      alternatives: ALTERNATIVES[trigger] ?? [],
      severity: 'info'
   }
}
