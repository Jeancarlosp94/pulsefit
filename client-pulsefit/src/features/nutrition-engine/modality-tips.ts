/**
 * Sprint 11.14: tips nutricionales contextualizados por modalidad activa.
 *
 * Firmados por Lucía (nutricionista): no reemplazan la distribución de macros
 * del día (esa la calcula distributeMacros según objetivo). Son consejos de
 * TIMING alrededor del entreno de la fase activa.
 *
 * Ejemplos:
 *   - HIIT/CrossFit → carbos pre + proteína post (ventana anabólica).
 *   - Yoga → hidratación + comidas ligeras + espacio de 90 min antes del flow.
 *   - Gym → proteína post + hidratación durante.
 *
 * NUNCA damos indicaciones médicas ni prescripción específica de gramos.
 * Solo timing y tipo de nutriente predominante.
 */

import type { ItfModality } from '@/interface/itfPrograms'

export interface ItfModalityNutritionTip {
   /** Frase corta (max 90 chars) que va en la card. */
   headline: string
   /** Detalle expandido (max 160 chars) con timing concreto. */
   detail: string
   /** Emoji contextual. */
   emoji: string
}

const TIPS: Record<ItfModality, ItfModalityNutritionTip> = {
   hiit: {
      emoji: '🔥',
      headline: 'Fase HIIT: carbos antes, proteína después',
      detail:
         'Snack con carbos 30-45 min antes (fruta o pan integral). Proteína en los 60 min post-entreno para recuperación.'
   },
   crossfit: {
      emoji: '🪨',
      headline: 'Fase CrossFit: come 60-90 min antes',
      detail:
         'Combina carbos complejos + proteína magra 60-90 min antes del WOD. Hidratación clave antes, durante y post.'
   },
   gym: {
      emoji: '🏋️',
      headline: 'Fase Gym: proteína post en 30-60 min',
      detail:
         'La ventana anabólica pide proteína completa (huevo, pollo, atún, tofu, yogur) dentro de la hora después del entreno.'
   },
   calistenia: {
      emoji: '🤸',
      headline: 'Fase Calistenia: mantén proteína pareja en el día',
      detail:
         'Distribuye la proteína en 4 comidas iguales. Los ejercicios con peso corporal exigen recuperación muscular constante.'
   },
   yoga: {
      emoji: '🧘',
      headline: 'Fase Yoga: comidas ligeras y agua tibia',
      detail:
         'Deja al menos 90 min entre comida y práctica. Hidratación con agua tibia + limón mejora la energía sin pesar.'
   },
   barre: {
      emoji: '🩰',
      headline: 'Fase Barre: proteína ligera + hidratación',
      detail:
         'Snack proteico ligero (yogur, huevo) 60 min antes. El isométrico prolongado quema glucógeno gradual, sin picos.'
   },
   pilates: {
      emoji: '🌀',
      headline: 'Fase Pilates: no entrenes con el estómago lleno',
      detail:
         'Comidas ligeras 90 min antes de la práctica. La respiración del método pide un abdomen cómodo y sin tensión.'
   },
   running: {
      emoji: '🏃',
      headline: 'Fase Running: carbos antes, sales después',
      detail:
         'Carbos de digestión rápida 45-60 min antes. Post-carrera: agua con electrolitos + carbos + algo de proteína.'
   },
   cycling: {
      emoji: '🚴',
      headline: 'Fase Bici: hidratación constante',
      detail:
         'En rutas largas, un sorbo cada 15 min. Snack cada 45 min si supera la hora (banana, dátiles, barra casera).'
   },
   swimming: {
      emoji: '🏊',
      headline: 'Fase Natación: espera 90 min post-comida',
      detail:
         'Nunca nades con el estómago lleno. Post-natación mete carbos + proteína rápido (te da mucha hambre).'
   },
   sport: {
      emoji: '⚽',
      headline: 'Fase Deporte: carga y recupera',
      detail:
         'Come 2-3 horas antes con carbos + proteína magra. Hidrátate bien la hora previa. Post: reponer con agua + comida real.'
   },
   hybrid: {
      emoji: '⚡',
      headline: 'Fase Mixta: escucha a tu cuerpo',
      detail:
         'Ajusta según la sesión del día: cardio pide más carbos, fuerza pide más proteína. Hidratación siempre.'
   }
}

export const getModalityNutritionTip = (modality: ItfModality): ItfModalityNutritionTip =>
   TIPS[modality]
