import type {
   ItfMealTrigger,
   ItfRescueAlternative,
   ItfRescueRequest,
   ItfRescueResponse
} from './types'

const ALTERNATIVES: Record<ItfMealTrigger, ItfRescueAlternative[]> = {
   no_cooking: [
      {
         id: 'ml_nocook_yogurt',
         title: 'Yogurt + fruta + granola',
         description: 'Sin fuego. ~400 kcal balanceadas, listo en 2 min.',
         icon: '🥣',
         action_label: 'Bowl frío'
      },
      {
         id: 'ml_nocook_sandwich',
         title: 'Sándwich integral',
         description: 'Pan integral + huevo duro + palta + tomate. Saciante, sin estufa.',
         icon: '🥪',
         action_label: 'Sándwich'
      },
      {
         id: 'ml_nocook_buy',
         title: 'Comprar algo balanceado',
         description: 'Una ensalada del super con proteína. Te decimos qué evitar.',
         icon: '🛒',
         action_label: 'Comprar listo'
      }
   ],
   no_ingredients: [
      {
         id: 'ml_noing_pasta',
         title: 'Pasta con lo que tengas',
         description: 'Pasta + aceite + ajo + lo que sobre del refri. Cuenta como comida real.',
         icon: '🍝',
         action_label: 'Pasta express'
      },
      {
         id: 'ml_noing_arroz',
         title: 'Arroz + huevo + verdura',
         description: 'Combinación universal LATAM. Macros decentes, ingredientes mínimos.',
         icon: '🍚',
         action_label: 'Arroz simple'
      },
      {
         id: 'ml_noing_shop',
         title: 'Lista de compras urgente',
         description: 'Te abrimos la lista de la semana para comprar 5 cosas básicas.',
         icon: '🛒',
         action_label: 'Ver lista'
      }
   ],
   eating_out: [
      {
         id: 'ml_out_protein',
         title: 'Pide algo con proteína',
         description: 'Pollo a la plancha, pescado, lomo. Acompañar con vegetales o ensalada.',
         icon: '🍽️',
         action_label: 'Proteína magra'
      },
      {
         id: 'ml_out_split',
         title: 'Pide para compartir',
         description: 'Dividir un plato grande te ahorra calorías y disfrutas igual.',
         icon: '🤝',
         action_label: 'Compartir'
      },
      {
         id: 'ml_out_enjoy',
         title: 'Disfruta sin culpa',
         description: 'Una comida no rompe nada. Mañana volvemos al plan sin compensar.',
         icon: '🌿',
         action_label: 'Disfrutar'
      }
   ],
   craving: [
      {
         id: 'ml_crav_portion',
         title: 'Porción consciente',
         description: 'Sírvete una porción chica, en plato, sentada/o. No te lo prohibimos.',
         icon: '🍪',
         action_label: 'Comer poco'
      },
      {
         id: 'ml_crav_balance',
         title: 'Versión balanceada',
         description: 'Si es dulce, prueba fruta + yogurt + miel. Si es salado, palomitas caseras.',
         icon: '⚖️',
         action_label: 'Balanceado'
      },
      {
         id: 'ml_crav_wait',
         title: 'Esperá 15 min',
         description: 'A veces el antojo es sed o aburrimiento. 15 min después, decides de nuevo.',
         icon: '⏳',
         action_label: 'Esperar'
      }
   ],
   low_budget_today: [
      {
         id: 'ml_budget_lentejas',
         title: 'Lentejas + arroz',
         description: 'Combinación de proteína completa LATAM. Económica, saciante, deliciosa.',
         icon: '🥘',
         action_label: 'Lentejas'
      },
      {
         id: 'ml_budget_huevos',
         title: 'Huevos en cualquier forma',
         description: 'Revueltos, duros, tortilla, omelet. 3 huevos = proteína de un buen filete.',
         icon: '🥚',
         action_label: 'Huevos'
      },
      {
         id: 'ml_budget_pasta_atun',
         title: 'Pasta con atún',
         description: 'Lata de atún + pasta + aceite + perejil. Económico y completo.',
         icon: '🐟',
         action_label: 'Pasta con atún'
      }
   ]
}

const INTROS: Record<ItfMealTrigger, string> = {
   no_cooking: 'Sin cocinar hoy. 3 opciones balanceadas sin estufa:',
   no_ingredients: 'Refrigerador vacío también es una situación real. Veamos qué hay:',
   eating_out: 'Comer fuera es parte de la vida. Te ayudamos a elegir bien:',
   craving: 'El antojo no es enemigo. Estas opciones lo incluyen sin descarrilar el día:',
   low_budget_today: 'Bolsillo apretado. Recetas LATAM económicas y completas:'
}

export const generateMealRescue = (req: ItfRescueRequest): ItfRescueResponse => {
   const trigger = req.trigger as ItfMealTrigger
   return {
      domain: 'meal',
      trigger,
      intro: INTROS[trigger],
      alternatives: ALTERNATIVES[trigger] ?? [],
      severity: 'info'
   }
}
