/**
 * Directorio de recursos profesionales por país LATAM.
 * Líneas 24/7 de salud mental + crisis. Datos públicos verificados.
 *
 * IMPORTANTE: PulseFit no recomienda profesionales específicos. Solo lista
 * recursos públicos oficiales del país del usuario.
 */

export interface ItfMentalHealthResource {
   name: string
   /** Tipo: línea de crisis 24/7, directorio profesional, info general. */
   type: 'crisis_line' | 'directory' | 'info'
   /** Número de teléfono o URL para contactar. */
   contact: string
   /** Horario (default 24/7 para crisis). */
   hours: string
   /** Costo (gratis / pago / no especificado). */
   cost: 'free' | 'paid' | 'na'
}

export interface ItfCountryResources {
   country_code: string
   country_name: string
   resources: ItfMentalHealthResource[]
}

export const PROFESSIONAL_RESOURCES: Record<string, ItfCountryResources> = {
   EC: {
      country_code: 'EC',
      country_name: 'Ecuador',
      resources: [
         {
            name: 'Línea SOS Salud Mental (Ministerio de Salud)',
            type: 'crisis_line',
            contact: '171 (opción 6)',
            hours: '24/7',
            cost: 'free'
         },
         {
            name: 'Federación Ecuatoriana de Psicólogos Clínicos',
            type: 'directory',
            contact: 'https://www.fepc.org.ec',
            hours: 'horario laboral',
            cost: 'paid'
         }
      ]
   },
   PE: {
      country_code: 'PE',
      country_name: 'Perú',
      resources: [
         {
            name: 'Línea 113 - opción 5 (Salud Mental MINSA)',
            type: 'crisis_line',
            contact: '113',
            hours: '24/7',
            cost: 'free'
         },
         {
            name: 'Colegio de Psicólogos del Perú',
            type: 'directory',
            contact: 'https://www.cpsp.pe',
            hours: 'horario laboral',
            cost: 'paid'
         }
      ]
   },
   CO: {
      country_code: 'CO',
      country_name: 'Colombia',
      resources: [
         {
            name: 'Línea 192 - opción 4 (Salud Mental)',
            type: 'crisis_line',
            contact: '192',
            hours: '24/7',
            cost: 'free'
         },
         {
            name: 'Asociación Colombiana de Trastornos de Alimentación',
            type: 'directory',
            contact: 'https://www.acta-colombia.org',
            hours: 'horario laboral',
            cost: 'na'
         }
      ]
   },
   MX: {
      country_code: 'MX',
      country_name: 'México',
      resources: [
         {
            name: 'SAPTEL (Sistema Nacional de Apoyo Psicológico por Teléfono)',
            type: 'crisis_line',
            contact: '55 5259 8121',
            hours: '24/7',
            cost: 'free'
         },
         {
            name: 'Línea de la Vida',
            type: 'crisis_line',
            contact: '800 290 0024',
            hours: '24/7',
            cost: 'free'
         }
      ]
   },
   AR: {
      country_code: 'AR',
      country_name: 'Argentina',
      resources: [
         {
            name: 'Centro de Asistencia al Suicida (CAS)',
            type: 'crisis_line',
            contact: '135 (CABA) / 011 5275 1135',
            hours: '24/7',
            cost: 'free'
         },
         {
            name: 'ALUBA - Asociación Lucha contra Bulimia y Anorexia',
            type: 'directory',
            contact: 'https://www.aluba.org.ar',
            hours: 'horario laboral',
            cost: 'na'
         }
      ]
   },
   CL: {
      country_code: 'CL',
      country_name: 'Chile',
      resources: [
         {
            name: 'Salud Responde - Salud Mental',
            type: 'crisis_line',
            contact: '600 360 7777 (opción 1)',
            hours: '24/7',
            cost: 'free'
         },
         {
            name: 'Fundación Todo Mejora',
            type: 'crisis_line',
            contact: '+56 9 4244 3567',
            hours: '24/7',
            cost: 'free'
         }
      ]
   },
   VE: {
      country_code: 'VE',
      country_name: 'Venezuela',
      resources: [
         {
            name: 'Programa Sanamente Fundación Bengoa',
            type: 'directory',
            contact: 'https://www.fundacionbengoa.org',
            hours: 'horario laboral',
            cost: 'na'
         }
      ]
   },
   UY: {
      country_code: 'UY',
      country_name: 'Uruguay',
      resources: [
         {
            name: 'Línea Vida (ASSE)',
            type: 'crisis_line',
            contact: '0800 0767',
            hours: '24/7',
            cost: 'free'
         }
      ]
   },
   PY: {
      country_code: 'PY',
      country_name: 'Paraguay',
      resources: [
         {
            name: 'Línea de Apoyo Salud Mental MSPBS',
            type: 'crisis_line',
            contact: '147',
            hours: '24/7',
            cost: 'free'
         }
      ]
   },
   BO: {
      country_code: 'BO',
      country_name: 'Bolivia',
      resources: [
         {
            name: 'Línea de Crisis Salud Mental (Ministerio de Salud)',
            type: 'crisis_line',
            contact: '800-10-1104',
            hours: '24/7',
            cost: 'free'
         }
      ]
   },
   /** Genérico para LATAM si no detectamos país. */
   default: {
      country_code: 'default',
      country_name: 'LATAM',
      resources: [
         {
            name: 'OMS - Línea internacional de salud mental',
            type: 'info',
            contact: 'https://www.who.int/teams/mental-health-and-substance-use',
            hours: 'siempre disponible online',
            cost: 'free'
         },
         {
            name: 'Find a Helpline (líneas por país)',
            type: 'directory',
            contact: 'https://findahelpline.com/',
            hours: 'siempre disponible online',
            cost: 'free'
         }
      ]
   }
}

/** Devuelve los recursos del país del usuario o el genérico LATAM. */
export const getResourcesForCountry = (
   countryCode: string | null | undefined
): ItfCountryResources => {
   if (!countryCode) return PROFESSIONAL_RESOURCES.default
   const normalized = countryCode.toUpperCase()
   return PROFESSIONAL_RESOURCES[normalized] ?? PROFESSIONAL_RESOURCES.default
}
