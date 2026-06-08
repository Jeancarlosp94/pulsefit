/**
 * Saludo dinámico según la hora local. Tono compasivo: nunca apurar, siempre acompañar.
 * Usado por el TopBar y por mensajes IA en fases siguientes.
 */
export const getGreeting = (date: Date = new Date()): string => {
   const hour = date.getHours()
   if (hour >= 5 && hour < 12) return 'Buenos días'
   if (hour >= 12 && hour < 19) return 'Buenas tardes'
   return 'Buenas noches'
}
