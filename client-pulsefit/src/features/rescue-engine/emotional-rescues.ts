import type {
   ItfEmotionalTrigger,
   ItfRescueAlternative,
   ItfRescueRequest,
   ItfRescueResponse,
   ItfRescueSeverity
} from './types'

/**
 * Rescates emocionales — más sensibles que workout/meal porque tocan
 * señales que pueden necesitar escalamiento a profesionales.
 *
 * Severity:
 *   info       → 3 opciones autocuidado simples
 *   warn       → sugiere hablar con profesional
 *   escalation → pantalla con recursos profesionales (no skippable)
 */

const ALTERNATIVES: Record<ItfEmotionalTrigger, ItfRescueAlternative[]> = {
   overwhelmed: [
      {
         id: 'em_over_pause',
         title: 'Pausa de 5 minutos',
         description: '5 respiraciones lentas. Sin pantalla. Sin objetivo. Solo respirar.',
         icon: '🫁',
         action_label: 'Respirar'
      },
      {
         id: 'em_over_walk',
         title: 'Caminar al aire libre',
         description: 'Salir 10 min. Aunque sea por el edificio. Mueve el cuerpo.',
         icon: '🚶',
         action_label: 'Salir'
      },
      {
         id: 'em_over_talk',
         title: 'Habla con alguien',
         description: 'Llamar a una persona de confianza. No tienes que resolverlo solo.',
         icon: '📞',
         action_label: 'Llamar'
      }
   ],
   binge: [
      {
         id: 'em_binge_kind',
         title: 'No compenses',
         description: 'Mañana volvemos al plan normal. Sin extra cardio, sin saltarse comidas.',
         icon: '🌿',
         action_label: 'Aceptar y seguir'
      },
      {
         id: 'em_binge_water',
         title: 'Agua y caminar',
         description: 'Hidrátate y camina suave. Sin auto-castigo. Tu cuerpo se regula.',
         icon: '💧',
         action_label: 'Agua + caminar'
      },
      {
         id: 'em_binge_help',
         title: 'Si se repite, busquemos ayuda',
         description: 'Pasar por esto seguido vale la pena hablarlo con un profesional 🌿',
         icon: '🤝',
         action_label: 'Ver recursos'
      }
   ],
   low_mood_streak: [
      {
         id: 'em_lms_pro',
         title: 'Hablar con un profesional',
         description: 'Buscar ayuda es valentía. Te mostramos recursos locales sin costo.',
         icon: '🤝',
         action_label: 'Ver recursos'
      },
      {
         id: 'em_lms_pause',
         title: 'Pausar el plan',
         description: 'Pausamos objetivos por unos días. Lo único importante: cuidarte.',
         icon: '⏸️',
         action_label: 'Pausar plan'
      }
   ]
}

const INTROS: Record<ItfEmotionalTrigger, string> = {
   overwhelmed: 'Demasiado a la vez. Estas 3 opciones bajan la intensidad sin renunciar a hoy:',
   binge: 'Pasa, pasó, va a pasar. Lo importante: cómo respondes después 🌿',
   low_mood_streak: 'Notamos que llevas varios días bajos. Esto vale la pena revisarlo:'
}

const SEVERITY: Record<ItfEmotionalTrigger, ItfRescueSeverity> = {
   overwhelmed: 'info',
   binge: 'warn',
   low_mood_streak: 'warn'
}

export const generateEmotionalRescue = (req: ItfRescueRequest): ItfRescueResponse => {
   const trigger = req.trigger as ItfEmotionalTrigger
   return {
      domain: 'emotional',
      trigger,
      intro: INTROS[trigger],
      alternatives: ALTERNATIVES[trigger] ?? [],
      severity: SEVERITY[trigger]
   }
}
