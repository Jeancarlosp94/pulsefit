import type { ItfMealComponents, ItfMealType, ItfPlateOption } from './types'

/**
 * Plantillas de fallback usadas cuando la IA falla 2 veces.
 *
 * Características obligatorias (de generadores-hibridos.md sección 8):
 *   - 3 plantillas distintas por meal_type.
 *   - Nombres APETITOSOS con adjetivos cálidos LATAM (no robóticos).
 *   - Detecta ingredientes especiales (polvos, semillas) y usa templates apropiados.
 *   - Pasos genéricos pero coherentes y compasivos.
 *   - Sin promesas estéticas ni consejos médicos.
 *   - Funciona con CUALQUIER combinación de componentes.
 *
 * La app NUNCA queda sin plan: si esta función recibe un input válido,
 * SIEMPRE devuelve 3 opciones.
 *
 * Sprint 11.9 — rediseño con foco en apetencia:
 *   - Templates por meal_type (desayuno ≠ almuerzo).
 *   - Whey/proteína en polvo se convierte en "Batido/Shake" no "Salteado".
 *   - Adjetivos rotados: "casero", "criollo", "fresco", "rápido", "sazonado".
 */

const MEAL_LABEL: Record<ItfMealType, string> = {
   breakfast: 'el desayuno',
   lunch: 'el almuerzo',
   dinner: 'la cena',
   snack_am: 'la media mañana',
   snack_pm: 'la media tarde'
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Sprint 11.16b: retorna nombre del ingrediente sin gramos.
 * Los gramos ya viven en la lista visible al usuario; repetirlos en los
 * pasos es redundante y el Chef Diego los rechaza.
 *
 * Heurística de artículo (bastante buena para LATAM):
 *   - Nombres que empiezan con "pechuga", "avena", "arepa", "papa", "carne",
 *     "leche", "banana", "quinoa", "tortilla", "sardina" → "la"
 *   - Nombres que empiezan con vocal "a"/"o" y son femeninos comunes.
 *   - El resto → "el" (default). Errores menores tipo "el pasta" son
 *     tolerables vs. exponer gramos inconsistentes.
 */
const FEMININE_STARTS =
   /^(pechuga|avena|arepa|papa|carne|leche|banana|quinoa|tortilla|sardina|espinaca|zanahoria|calabaza|cebolla|lechuga|proteína|manzana|naranja|salsa|pasta|granola|mantequilla|piña|palta|palma|harina)\b/i

const ingredientName = (s: { ingredient: { name: string }; grams: number }) => {
   const name = s.ingredient.name
   const article = FEMININE_STARTS.test(name) ? 'la' : 'el'
   return `${article} ${name}`
}

/* Detección de ingredientes especiales que requieren templates diferentes. */
const isPowderProtein = (name: string): boolean =>
   /polvo|whey|caseina|caseína|proteína en/i.test(name)

const isOatLike = (name: string): boolean => /avena|granola|cereal/i.test(name)

const isEgg = (name: string): boolean => /huevo|huevos/i.test(name)

const isCheese = (name: string): boolean => /queso|cottage|ricotta/i.test(name)

const isYogurt = (name: string): boolean => /yogurt|yogur/i.test(name)

const isFish = (name: string): boolean =>
   /pescado|tilapia|atún|salmón|salmon|sardina|merluza|filete de/i.test(name)

/* ============================================================
 *  TEMPLATES POR MEAL_TYPE — Sprint 11.9
 * ============================================================ */

const buildBreakfastFallback = (components: ItfMealComponents): ItfPlateOption[] => {
   const { protein, carb, fat, vegetable } = components
   const hasVeg = vegetable.grams > 0
   const proteinName = protein.ingredient.name
   const carbName = carb.ingredient.name

   /* Si es proteína en polvo → templates de batido (NO salteado). */
   if (isPowderProtein(proteinName)) {
      return [
         {
            name: `Batido casero con ${carbName} y ${proteinName}`,
            description: 'Desayuno rápido y proteico, listo en 5 minutos.',
            prep_time_min: 5,
            difficulty: 'easy',
            steps: [
               `Coloca ${ingredientName(protein)} en una licuadora con 250ml de agua o leche.`,
               `Agrega ${ingredientName(carb)} para dar cuerpo y energía sostenida.`,
               `Suma ${ingredientName(fat)} (mantequilla de maní, almendra, etc.) para saciedad.`,
               `Licúa 30 segundos hasta que quede cremoso.`,
               `Sirve frío en un vaso grande, con canela o vainilla al gusto.`
            ]
         },
         {
            name: `Bowl proteico de ${carbName} con ${proteinName}`,
            description: 'Versión bowl espesa, para comer con cuchara.',
            prep_time_min: 8,
            difficulty: 'easy',
            steps: [
               `Cocina ${ingredientName(carb)} con poca agua hasta que quede cremoso.`,
               `Cuando esté listo, retira del fuego y deja templar 1 minuto.`,
               `Mezcla ${ingredientName(protein)} bien disuelto (evita que cocine para no cortar la proteína).`,
               `Agrega ${ingredientName(fat)} y mezcla.`,
               `Sirve en bowl con canela, cacao o frutos rojos al gusto.`
            ]
         },
         {
            name: `Avena overnight con ${proteinName}`,
            description: 'Prepárala la noche anterior, listo al despertar.',
            prep_time_min: 5,
            difficulty: 'easy',
            steps: [
               `La noche anterior: mezcla ${ingredientName(carb)} con 250ml de leche o agua en un frasco.`,
               `Agrega ${ingredientName(protein)} disuelto.`,
               `Suma ${ingredientName(fat)} y un toque de canela.`,
               `Cierra y refrigera mínimo 6 horas.`,
               `Al despertar: disfruta frío o tibio. Decora con fruta fresca.`
            ]
         }
      ]
   }

   /* Si es huevos → tortilla / revuelto / arepa rellena. */
   if (isEgg(proteinName)) {
      return [
         {
            name: `Tortilla casera de ${proteinName} con ${carbName}`,
            description: 'Desayuno clásico LATAM, sencillo y nutritivo.',
            prep_time_min: 15,
            difficulty: 'easy',
            steps: [
               `Bate ${ingredientName(protein)} con sal y pimienta hasta integrar bien.`,
               `Calienta ${ingredientName(fat)} en una sartén antiadherente a fuego medio.`,
               `Si tienes ${carbName} (papa, pan), cocínalo aparte primero.`,
               hasVeg
                  ? `Saltea ${ingredientName(vegetable)} brevemente con sal.`
                  : `Agrega cebolla picada para sabor.`,
               `Vierte los huevos batidos y cocina 3-4 min por lado hasta dorar suave.`,
               `Sirve junto con ${carbName} y disfruta tibio.`
            ]
         },
         {
            name: `${cap(proteinName)} revueltos con ${carbName} a la plancha`,
            description: 'Estilo desayuno rápido casero.',
            prep_time_min: 12,
            difficulty: 'easy',
            steps: [
               `Calienta una sartén con ${ingredientName(fat)} a fuego medio.`,
               `Tuesta o calienta ${ingredientName(carb)} en otra sartén.`,
               `Vierte ${ingredientName(protein)} en la sartén y mezcla constantemente con espátula.`,
               hasVeg
                  ? `Suma ${ingredientName(vegetable)} picado fino y mezcla 2 min más.`
                  : `Sazona con sal, pimienta y cebollín.`,
               `Sirve sobre ${carbName} caliente con un toque de palta si tienes.`
            ]
         },
         {
            name: `Bowl matutino con ${proteinName} y ${carbName}`,
            description: 'Desayuno completo en bowl, balanceado.',
            prep_time_min: 12,
            difficulty: 'easy',
            steps: [
               `Cocina ${ingredientName(carb)} hasta su punto (avena, arroz, papa).`,
               `Hierve ${ingredientName(protein)} o cocínalos a tu gusto.`,
               `Calienta ${ingredientName(fat)} y agrégalo crudo al bowl.`,
               hasVeg
                  ? `Cuece ${ingredientName(vegetable)} al vapor 3 min.`
                  : `Corta tomate fresco y palta para acompañar.`,
               `Sirve todo en bowl, condimenta con sal, pimienta y limón.`
            ]
         }
      ]
   }

   /* Si carb es avena/cereal → templates de bowl/granola. */
   if (isOatLike(carbName)) {
      return [
         {
            name: `Tazón de ${carbName} con ${proteinName}`,
            description: 'Desayuno calentito, cremoso y rendidor.',
            prep_time_min: 10,
            difficulty: 'easy',
            steps: [
               `Cocina ${ingredientName(carb)} con 250ml de leche o agua, fuego medio.`,
               `Cuando espese, retira y deja templar.`,
               `Mezcla ${ingredientName(protein)} bien integrado.`,
               `Agrega ${ingredientName(fat)} (mantequilla de maní, almendras) por encima.`,
               `Termina con canela, miel pequeña o frutas. Sirve tibio.`
            ]
         },
         {
            name: `Bowl frío con ${carbName} y ${proteinName}`,
            description: 'Versión refrescante para días calurosos.',
            prep_time_min: 5,
            difficulty: 'easy',
            steps: [
               `En un bowl mezcla ${ingredientName(carb)} con yogurt frío o leche.`,
               `Agrega ${ingredientName(protein)} en trocitos o disuelto.`,
               `Suma ${ingredientName(fat)} como topping.`,
               `Decora con fruta fresca de temporada.`,
               `Sirve inmediatamente, frío.`
            ]
         },
         {
            name: `Pancakes caseros con ${carbName}`,
            description: 'Desayuno especial pero rápido.',
            prep_time_min: 15,
            difficulty: 'medium',
            steps: [
               `Bate ${ingredientName(protein)} con leche hasta integrar.`,
               `Suma ${ingredientName(carb)} molida y mezcla en una masa fluida.`,
               `Calienta sartén con ${ingredientName(fat)} a fuego medio bajo.`,
               `Cocina cucharones pequeños, da vuelta cuando burbujee.`,
               `Sirve con fruta y un toque de miel o canela.`
            ]
         }
      ]
   }

   /* Default desayuno: tostada, sandwich, bowl. */
   return [
      {
         name: `Sándwich casero de ${proteinName}`,
         description: 'Desayuno práctico para empezar el día.',
         prep_time_min: 10,
         difficulty: 'easy',
         steps: [
            `Tuesta ${ingredientName(carb)} a tu gusto.`,
            `Cocina ${ingredientName(protein)} a la plancha con un toque de ${ingredientName(fat)}.`,
            hasVeg
               ? `Lava y corta ${ingredientName(vegetable)} fresco (tomate, lechuga).`
               : `Prepara palta o queso fresco para acompañar.`,
            `Arma el sándwich con todos los ingredientes.`,
            `Sirve con un café o jugo natural.`
         ]
      },
      {
         name: `${cap(proteinName)} al horno con ${carbName}`,
         description: 'Versión completa para mañanas con tiempo.',
         prep_time_min: 25,
         difficulty: 'medium',
         steps: [
            `Precalienta el horno a 180°C.`,
            `Coloca ${ingredientName(carb)} en una bandeja con ${ingredientName(fat)}.`,
            `Pon ${ingredientName(protein)} encima y sazona con sal, pimienta y especias.`,
            hasVeg
               ? `Suma ${ingredientName(vegetable)} alrededor.`
               : `Agrega rodajas de tomate o cebolla.`,
            `Hornea 20 min hasta dorar. Sirve caliente.`
         ]
      },
      {
         name: `Bowl matutino balanceado`,
         description: 'Desayuno completo en bowl, sin perder tiempo.',
         prep_time_min: 12,
         difficulty: 'easy',
         steps: [
            `Cocina ${ingredientName(carb)} hasta su punto.`,
            `Prepara ${ingredientName(protein)} a la plancha o hervido.`,
            hasVeg
               ? `Saltea ${ingredientName(vegetable)} brevemente.`
               : `Lava fruta fresca para decorar.`,
            `Calienta ${ingredientName(fat)} y agrégalo al final.`,
            `Sirve todo en bowl, condimenta a gusto.`
         ]
      }
   ]
}

const buildSnackFallback = (components: ItfMealComponents): ItfPlateOption[] => {
   const { protein, carb, fat } = components
   const proteinName = protein.ingredient.name
   const carbName = carb.ingredient.name

   /* Snacks con proteína en polvo → batidos. */
   if (isPowderProtein(proteinName)) {
      return [
         {
            name: `Shake rápido con ${proteinName}`,
            description: 'Snack proteico listo en 2 minutos.',
            prep_time_min: 3,
            difficulty: 'easy',
            steps: [
               `Mezcla ${ingredientName(protein)} con 200ml de agua o leche fría.`,
               `Agrega ${ingredientName(carb)} (avena instantánea o fruta).`,
               `Suma ${ingredientName(fat)} para mayor saciedad.`,
               `Bate o licúa 20 segundos.`,
               `Sirve frío.`
            ]
         },
         {
            name: `Smoothie de fruta con ${proteinName}`,
            description: 'Refrescante y nutritivo, ideal post-entreno.',
            prep_time_min: 5,
            difficulty: 'easy',
            steps: [
               `Licúa ${ingredientName(carb)} (banana, frutilla) con ${ingredientName(protein)}.`,
               `Agrega 200ml de leche o agua de coco.`,
               `Suma ${ingredientName(fat)} (mantequilla de maní o semillas).`,
               `Licúa hasta cremoso.`,
               `Sirve frío con hielo si te gusta.`
            ]
         },
         {
            name: `Bowl proteico en 5 min`,
            description: 'Versión bowl para comer con cuchara.',
            prep_time_min: 5,
            difficulty: 'easy',
            steps: [
               `En un bowl mezcla ${ingredientName(carb)} con yogurt o leche.`,
               `Agrega ${ingredientName(protein)} disuelto.`,
               `Suma ${ingredientName(fat)} como topping.`,
               `Decora con fruta o cacao.`,
               `Sirve frío o a temperatura ambiente.`
            ]
         }
      ]
   }

   /* Snacks con yogurt → parfait. */
   if (isYogurt(proteinName)) {
      return [
         {
            name: `Parfait de yogurt con ${carbName}`,
            description: 'Snack en capas, fresco y reconfortante.',
            prep_time_min: 5,
            difficulty: 'easy',
            steps: [
               `En un vaso, alterna capas de ${ingredientName(protein)}.`,
               `Suma ${ingredientName(carb)} (granola, avena).`,
               `Agrega ${ingredientName(fat)} (almendras, nueces, semillas).`,
               `Decora con fruta fresca.`,
               `Sirve frío inmediatamente.`
            ]
         },
         {
            name: `Bowl frío de yogurt con ${carbName}`,
            description: 'Snack saludable y rápido.',
            prep_time_min: 4,
            difficulty: 'easy',
            steps: [
               `En un bowl coloca ${ingredientName(protein)}.`,
               `Mezcla con ${ingredientName(carb)}.`,
               `Suma ${ingredientName(fat)} por encima.`,
               `Endulza con miel o canela si quieres.`,
               `Sirve frío.`
            ]
         },
         {
            name: `Smoothie cremoso`,
            description: 'Versión líquida para llevar.',
            prep_time_min: 4,
            difficulty: 'easy',
            steps: [
               `Licúa ${ingredientName(protein)} con ${ingredientName(carb)}.`,
               `Suma fruta fresca o congelada.`,
               `Agrega ${ingredientName(fat)} y un toque de canela.`,
               `Bate hasta cremoso.`,
               `Sirve frío.`
            ]
         }
      ]
   }

   /* Snacks default: sandwich, mix, bowl pequeño. */
   return [
      {
         name: `Mini sándwich casero con ${proteinName}`,
         description: 'Snack práctico para llevar.',
         prep_time_min: 8,
         difficulty: 'easy',
         steps: [
            `Tuesta ${ingredientName(carb)} pequeño o use galletas integrales.`,
            `Prepara ${ingredientName(protein)} simple (a la plancha o hervido).`,
            `Suma ${ingredientName(fat)} (palta, queso, mantequilla de maní).`,
            `Arma el snack en formato mini.`,
            `Disfruta a temperatura ambiente.`
         ]
      },
      {
         name: `Bowl pequeño con ${proteinName}`,
         description: 'Versión bowl rápida para snack.',
         prep_time_min: 6,
         difficulty: 'easy',
         steps: [
            `Cocina o prepara ${ingredientName(protein)} simple.`,
            `Combina con ${ingredientName(carb)}.`,
            `Suma ${ingredientName(fat)} por encima.`,
            `Sazona con sal y pimienta.`,
            `Disfruta tibio o frío.`
         ]
      },
      {
         name: `Mezcla casera de ${proteinName} y ${carbName}`,
         description: 'Snack rápido y saciante.',
         prep_time_min: 5,
         difficulty: 'easy',
         steps: [
            `Combina ${ingredientName(protein)} con ${ingredientName(carb)}.`,
            `Agrega ${ingredientName(fat)} (semillas, frutos secos).`,
            `Sazona suave: sal, pimienta o canela.`,
            `Mezcla todo.`,
            `Sirve frío o tibio según tu gusto.`
         ]
      }
   ]
}

const buildMainMealFallback = (
   components: ItfMealComponents,
   mealType: ItfMealType
): ItfPlateOption[] => {
   const { protein, carb, fat, vegetable } = components
   const hasVeg = vegetable.grams > 0
   const proteinName = protein.ingredient.name
   const carbName = carb.ingredient.name
   const vegName = hasVeg ? vegetable.ingredient.name : ''

   const isFishProtein = isFish(proteinName)
   const isCheeseProtein = isCheese(proteinName)

   /* Si la proteína es pescado: templates específicos al horno/a la plancha. */
   if (isFishProtein) {
      return [
         {
            name: `${cap(proteinName)} a la plancha con ${carbName}`,
            description: `Plato fresco, ideal para ${MEAL_LABEL[mealType]}.`,
            prep_time_min: 20,
            difficulty: 'easy',
            steps: [
               `Sazona ${ingredientName(protein)} con sal, pimienta, ajo y un toque de limón.`,
               `Cocina ${ingredientName(carb)} aparte hasta su punto.`,
               `Calienta una sartén con ${ingredientName(fat)} y cocina el pescado 3-4 min por lado.`,
               hasVeg
                  ? `Saltea ${ingredientName(vegetable)} con sal y un toque de ajo.`
                  : `Prepara ensalada simple con limón.`,
               `Sirve el pescado sobre ${carbName} con un toque de limón fresco.`
            ]
         },
         {
            name: `${cap(proteinName)} al horno con vegetales`,
            description: `Versión asada, jugosa y aromática.`,
            prep_time_min: 30,
            difficulty: 'medium',
            steps: [
               `Precalienta el horno a 200°C.`,
               `Coloca ${ingredientName(protein)} en una bandeja con ${ingredientName(fat)}.`,
               `Sazona con sal, pimienta, limón y hierbas (orégano, perejil).`,
               hasVeg
                  ? `Suma ${ingredientName(vegetable)} alrededor.`
                  : `Agrega rodajas de limón y ajo.`,
               `Hornea 15-20 min según grosor. Sirve junto con ${carbName} caliente.`
            ]
         },
         {
            name: `Bowl marinero con ${proteinName}`,
            description: 'Versión bowl, completa y fresca.',
            prep_time_min: 22,
            difficulty: 'easy',
            steps: [
               `Cocina ${ingredientName(carb)} hasta su punto.`,
               `Sazona ${ingredientName(protein)} con limón, sal y pimienta.`,
               `Cocina en sartén con ${ingredientName(fat)} 3-4 min por lado.`,
               hasVeg
                  ? `Prepara ${ingredientName(vegetable)} al vapor o crudo.`
                  : `Suma palta, tomate o cebolla morada en cubos.`,
               `Arma todo en bowl, decora con limón y cilantro.`
            ]
         }
      ]
   }

   /* Si la proteína es queso: templates de horneado, ensalada con queso. */
   if (isCheeseProtein) {
      return [
         {
            name: `${cap(carbName)} con ${proteinName} al horno`,
            description: `Plato horneado reconfortante.`,
            prep_time_min: 25,
            difficulty: 'easy',
            steps: [
               `Precalienta horno a 180°C.`,
               `Cocina ${ingredientName(carb)} hasta media cocción.`,
               `En una fuente combina ${ingredientName(carb)} con ${ingredientName(fat)}.`,
               `Cubre con ${ingredientName(protein)} desmenuzado.`,
               hasVeg
                  ? `Decora con ${ingredientName(vegetable)} alrededor.`
                  : `Termina con orégano y pimienta.`,
               `Hornea 15 min hasta dorar el queso. Sirve caliente.`
            ]
         },
         {
            name: `Ensalada caliente con ${proteinName}`,
            description: 'Plato fresco con toque tibio.',
            prep_time_min: 18,
            difficulty: 'easy',
            steps: [
               `Cocina ${ingredientName(carb)} y deja entibiar.`,
               `Lava y corta ${vegName || 'tomate y lechuga'}.`,
               `Calienta ${ingredientName(fat)} con ajo.`,
               `Combina todo en bowl con ${ingredientName(protein)} desmenuzado.`,
               `Aliña con limón, sal y aceite. Sirve tibio.`
            ]
         },
         {
            name: `Bowl casero con ${proteinName} y ${carbName}`,
            description: 'Versión bowl balanceada con queso.',
            prep_time_min: 15,
            difficulty: 'easy',
            steps: [
               `Cocina ${ingredientName(carb)} y reserva.`,
               `Calienta ${ingredientName(fat)} a fuego medio.`,
               hasVeg
                  ? `Saltea ${ingredientName(vegetable)} hasta brillante.`
                  : `Prepara tomate fresco picado.`,
               `Combina todo y termina con ${ingredientName(protein)} encima.`,
               `Sirve con un toque de orégano y pimienta.`
            ]
         }
      ]
   }

   /* Default principal: bowl, criollo casero, plato dividido. */
   const adjectives =
      mealType === 'lunch' ? ['casero', 'criollo', 'al sartén'] : ['rápido', 'casero', 'sazonado']

   return [
      {
         name: `Bowl ${adjectives[0]} de ${proteinName} con ${carbName}`,
         description: `Plato balanceado para ${MEAL_LABEL[mealType]}, fácil y sabroso.`,
         prep_time_min: 20,
         difficulty: 'easy',
         steps: [
            `Cocina ${ingredientName(carb)} con un toque de sal hasta su punto.`,
            `Sazona ${ingredientName(protein)} con sal, pimienta, ajo y comino al gusto.`,
            `Calienta ${ingredientName(fat)} en sartén y cocina la proteína 5-7 minutos.`,
            hasVeg
               ? `Saltea o cuece al vapor ${ingredientName(vegetable)} hasta tierno-crocante.`
               : `Prepara hierbas frescas (cilantro, perejil) y limón para decorar.`,
            `Sirve todo junto en bowl, con limón fresco al final.`
         ]
      },
      {
         name: `${cap(proteinName)} ${adjectives[1]} con ${carbName}${hasVeg ? ` y ${vegName}` : ''}`,
         description: `Versión casera y reconfortante.`,
         prep_time_min: 25,
         difficulty: 'easy',
         steps: [
            `Pica 2 dientes de ajo y media cebolla finamente.`,
            `Cocina ${ingredientName(carb)} con sal hasta su punto.`,
            `Calienta ${ingredientName(fat)} y dora ajo y cebolla 1 minuto.`,
            `Suma ${ingredientName(protein)} y cocina 5-7 min dorando bien.`,
            hasVeg
               ? `Agrega ${ingredientName(vegetable)} en los últimos 4 min.`
               : `Termina con pimienta, comino y un toque de limón.`,
            `Sirve en plato dividido junto con ${carbName} caliente.`
         ]
      },
      {
         name: `${cap(proteinName)} ${adjectives[2]} con ${carbName}${hasVeg ? ` y ${vegName}` : ''}`,
         description: `Plato rápido para días ocupados.`,
         prep_time_min: 18,
         difficulty: 'easy',
         steps: [
            `Cocina ${ingredientName(carb)} aparte y reserva caliente.`,
            `Corta ${proteinName} en cubos pequeños o tiras finas.`,
            `Calienta ${ingredientName(fat)} en sartén bien caliente.`,
            `Dora ${proteinName} con sal, pimienta y especias al gusto.`,
            hasVeg
               ? `Suma ${ingredientName(vegetable)} y saltea 2-3 min más.`
               : `Termina con cebollín, limón o salsa de soja suave.`,
            `Sirve sobre ${carbName} caliente, con hierbas frescas encima.`
         ]
      }
   ]
}

/* ============================================================
 *  ENTRY POINT
 * ============================================================ */

export const buildMealFallback = (
   components: ItfMealComponents,
   mealType: ItfMealType
): ItfPlateOption[] => {
   /* Sprint 11.9 — templates específicos por meal_type para mejorar apetencia. */
   if (mealType === 'breakfast') return buildBreakfastFallback(components)
   if (mealType === 'snack_am' || mealType === 'snack_pm') return buildSnackFallback(components)
   return buildMainMealFallback(components, mealType)
}
