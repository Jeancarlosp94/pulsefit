import type { ItfMealType } from './types'

/**
 * Catálogo de platos CANÓNICOS LATAM firmados por Diego (chef).
 *
 * La idea: en lugar de que la IA "componga creativamente" pollo+avena+aguacate,
 * partimos de un plato REAL que la gente conoce y comemos. La IA solo redacta
 * el nombre cálido + describe los pasos. El motor escala las gramas al target
 * calórico de cada slot.
 *
 * Cobertura inicial: 6 cocinas × ~5 platos = ~30 platos. Versión 1.
 * Iterar agregando más con tiempo y validación.
 */

export type ItfCuisine =
   | 'andina' /* Peru, Ecuador, Bolivia, Colombia, Venezuela */
   | 'mexicana' /* México y Centroamérica */
   | 'cono_sur' /* Argentina, Chile, Uruguay (rioplatense) */
   | 'brasilena'
   | 'asiatica' /* fusión liviana popular en LATAM */
   | 'mediterranea' /* base saludable universal */
   | 'caribena' /* PR, Cuba, RD — Sprint 11.6 */
   | 'paraguaya' /* PY — Sprint 11.6 */

export interface ItfCanonicalDish {
   id: string
   name: string
   cuisine: ItfCuisine
   /** Ingredientes base (IDs del pool). El motor escalará gramas. */
   baseIngredients: {
      protein?: string
      carb?: string
      fat?: string
      vegetable?: string
   }
   /** Para qué meal_type sirve. */
   mealTypes: ItfMealType[]
   /** Técnica principal (informativo para chef + UI). */
   technique: 'plancha' | 'wok' | 'horno' | 'guiso' | 'crudo' | 'hervido' | 'salteado' | 'frio'
   /** Dificultad estimada. */
   difficulty: 'easy' | 'medium' | 'hard'
   /** Tiempo aproximado (minutos) cuando se cocina con todo a mano. */
   prepTimeMin: number
   /** Hint corto para que la IA tenga contexto al redactar. */
   hint: string
}

export const CANONICAL_DISHES: ItfCanonicalDish[] = [
   /* ============================
    *  🇵🇪 / 🇪🇨 / 🇨🇴 — ANDINA
    * ============================ */
   {
      id: 'lomo-saltado',
      name: 'Lomo saltado light',
      cuisine: 'andina',
      baseIngredients: {
         protein: 'beef-lean',
         carb: 'rice-white',
         vegetable: 'onion',
         fat: 'sunflower-oil'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'wok',
      difficulty: 'medium',
      prepTimeMin: 25,
      hint: 'Salteado peruano de tiras de carne con cebolla y tomate al wok, servido sobre arroz blanco.'
   },
   {
      id: 'ceviche',
      name: 'Ceviche de pescado fresco',
      cuisine: 'andina',
      baseIngredients: {
         protein: 'fish-tilapia',
         vegetable: 'onion',
         fat: 'avocado',
         carb: 'sweet-potato'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'crudo',
      difficulty: 'easy',
      prepTimeMin: 20,
      hint: 'Pescado cocinado en jugo de limón con cebolla morada y palta, acompañado de camote.'
   },
   {
      id: 'arroz-con-pollo',
      name: 'Arroz con pollo a la peruana',
      cuisine: 'andina',
      baseIngredients: {
         protein: 'chicken-breast',
         carb: 'rice-white',
         vegetable: 'corn-fresh',
         fat: 'sunflower-oil'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'guiso',
      difficulty: 'medium',
      prepTimeMin: 30,
      hint: 'Arroz verde con cilantro, pollo desmenuzado y choclo, plato cálido de mediodía.'
   },
   {
      id: 'encebollado',
      name: 'Encebollado ligero',
      cuisine: 'andina',
      baseIngredients: {
         protein: 'tuna-can',
         vegetable: 'onion',
         carb: 'yuca',
         fat: 'sunflower-oil'
      },
      mealTypes: ['breakfast', 'lunch'],
      technique: 'guiso',
      difficulty: 'easy',
      prepTimeMin: 20,
      hint: 'Sopa ecuatoriana espesa de pescado con yuca y cebolla curtida, sabor casero.'
   },
   {
      id: 'arepa-rellena',
      name: 'Arepa rellena con queso fresco',
      cuisine: 'andina',
      baseIngredients: {
         protein: 'queso-fresco',
         carb: 'arepa-blanca',
         vegetable: 'tomato',
         fat: 'avocado'
      },
      mealTypes: ['breakfast', 'snack_pm'],
      technique: 'plancha',
      difficulty: 'easy',
      prepTimeMin: 15,
      hint: 'Arepa de maíz a la plancha rellena de queso fresco, palta y tomate.'
   },
   {
      id: 'ajiaco',
      name: 'Ajiaco ligero',
      cuisine: 'andina',
      baseIngredients: {
         protein: 'chicken-breast',
         carb: 'potato',
         vegetable: 'corn-fresh',
         fat: 'avocado'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'guiso',
      difficulty: 'medium',
      prepTimeMin: 35,
      hint: 'Sopa colombiana de pollo con tres papas, choclo y guascas, reconfortante.'
   },

   /* ============================
    *  🇲🇽 — MEXICANA
    * ============================ */
   {
      id: 'chilaquiles-verdes',
      name: 'Chilaquiles verdes con huevo',
      cuisine: 'mexicana',
      baseIngredients: {
         protein: 'eggs',
         carb: 'tortilla-maiz',
         vegetable: 'tomato',
         fat: 'avocado'
      },
      mealTypes: ['breakfast'],
      technique: 'salteado',
      difficulty: 'easy',
      prepTimeMin: 15,
      hint: 'Tortillas en salsa verde con huevo estrellado y palta, desayuno mexicano clásico.'
   },
   {
      id: 'tinga-pollo',
      name: 'Tinga de pollo en tostada',
      cuisine: 'mexicana',
      baseIngredients: {
         protein: 'chicken-breast',
         carb: 'tortilla-maiz',
         vegetable: 'onion',
         fat: 'avocado'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'guiso',
      difficulty: 'medium',
      prepTimeMin: 30,
      hint: 'Pollo deshebrado en salsa de jitomate con chipotle suave, sobre tortilla.'
   },
   {
      id: 'tacos-pescado',
      name: 'Tacos de pescado a la plancha',
      cuisine: 'mexicana',
      baseIngredients: {
         protein: 'fish-tilapia',
         carb: 'tortilla-maiz',
         vegetable: 'lettuce',
         fat: 'avocado'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'plancha',
      difficulty: 'easy',
      prepTimeMin: 20,
      hint: 'Tilapia a la plancha en tortilla con lechuga y palta, fresco y rápido.'
   },
   {
      id: 'huevos-rancheros',
      name: 'Huevos rancheros',
      cuisine: 'mexicana',
      baseIngredients: {
         protein: 'eggs',
         carb: 'tortilla-maiz',
         vegetable: 'tomato',
         fat: 'avocado'
      },
      mealTypes: ['breakfast'],
      technique: 'plancha',
      difficulty: 'easy',
      prepTimeMin: 12,
      hint: 'Huevos estrellados sobre tortilla con salsa roja casera y palta.'
   },
   {
      id: 'enmoladas-pollo',
      name: 'Enmoladas de pollo ligeras',
      cuisine: 'mexicana',
      baseIngredients: {
         protein: 'chicken-breast',
         carb: 'tortilla-maiz',
         vegetable: 'onion',
         fat: 'queso-fresco'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'horno',
      difficulty: 'medium',
      prepTimeMin: 35,
      hint: 'Tortillas rellenas de pollo bañadas en mole suave, terminadas con queso fresco.'
   },

   /* ============================
    *  🇦🇷 / 🇨🇱 / 🇺🇾 — CONO SUR
    * ============================ */
   {
      id: 'milanesa-horno',
      name: 'Milanesa al horno con ensalada',
      cuisine: 'cono_sur',
      baseIngredients: {
         protein: 'chicken-breast',
         carb: 'potato',
         vegetable: 'lettuce',
         fat: 'olive-oil'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'horno',
      difficulty: 'easy',
      prepTimeMin: 30,
      hint: 'Milanesa de pollo apanada y horneada con papas y ensalada, sin fritura.'
   },
   {
      id: 'pollo-grilla',
      name: 'Pollo a la parrilla con ensalada criolla',
      cuisine: 'cono_sur',
      baseIngredients: {
         protein: 'chicken-breast',
         vegetable: 'tomato',
         carb: 'sweet-potato',
         fat: 'olive-oil'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'plancha',
      difficulty: 'easy',
      prepTimeMin: 25,
      hint: 'Pechuga a la parrilla con ensalada de tomate, cebolla y morrón.'
   },
   {
      id: 'guiso-lentejas',
      name: 'Guiso de lentejas',
      cuisine: 'cono_sur',
      baseIngredients: {
         protein: 'lentils-cooked',
         carb: 'rice-white',
         vegetable: 'carrot',
         fat: 'olive-oil'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'guiso',
      difficulty: 'easy',
      prepTimeMin: 25,
      hint: 'Guiso casero de lentejas con sofrito de cebolla, zanahoria y morrón.'
   },
   {
      id: 'tortilla-papas',
      name: 'Tortilla de papas al horno',
      cuisine: 'cono_sur',
      baseIngredients: { protein: 'eggs', carb: 'potato', vegetable: 'onion', fat: 'olive-oil' },
      mealTypes: ['lunch', 'dinner'],
      technique: 'horno',
      difficulty: 'easy',
      prepTimeMin: 25,
      hint: 'Tortilla española de papa y cebolla terminada al horno, jugosa.'
   },

   /* ============================
    *  🇧🇷 — BRASILEÑA
    * ============================ */
   {
      id: 'feijoada-light',
      name: 'Feijoada ligera',
      cuisine: 'brasilena',
      baseIngredients: {
         protein: 'black-beans',
         carb: 'rice-white',
         vegetable: 'onion',
         fat: 'olive-oil'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'guiso',
      difficulty: 'medium',
      prepTimeMin: 35,
      hint: 'Feijoada al estilo casero con frijoles negros y poco cerdo, sobre arroz blanco.'
   },
   {
      id: 'moqueca-peixe',
      name: 'Moqueca de pescado',
      cuisine: 'brasilena',
      baseIngredients: {
         protein: 'fish-tilapia',
         carb: 'rice-white',
         vegetable: 'tomato',
         fat: 'olive-oil'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'guiso',
      difficulty: 'medium',
      prepTimeMin: 30,
      hint: 'Guiso bahiano de pescado con tomate, pimentón y cilantro fresco.'
   },
   {
      id: 'frango-grelhado',
      name: 'Frango grelhado com legumes',
      cuisine: 'brasilena',
      baseIngredients: {
         protein: 'chicken-breast',
         carb: 'sweet-potato',
         vegetable: 'broccoli',
         fat: 'olive-oil'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'plancha',
      difficulty: 'easy',
      prepTimeMin: 22,
      hint: 'Pollo a la plancha con verduras al vapor y batata asada.'
   },
   {
      id: 'tapioca-recheada',
      name: 'Tapioca rellena con queso fresco',
      cuisine: 'brasilena',
      baseIngredients: { protein: 'queso-fresco', carb: 'arepa-blanca', fat: 'butter-unsalted' },
      mealTypes: ['breakfast', 'snack_am'],
      technique: 'plancha',
      difficulty: 'easy',
      prepTimeMin: 10,
      hint: 'Tapioca a la plancha rellena de queso fresco, desayuno brasilero rápido.'
   },

   /* ============================
    *  🌏 — ASIÁTICA (fusión liviana)
    * ============================ */
   {
      id: 'pollo-teriyaki',
      name: 'Pollo teriyaki ligero',
      cuisine: 'asiatica',
      baseIngredients: {
         protein: 'chicken-breast',
         carb: 'rice-white',
         vegetable: 'broccoli',
         fat: 'sunflower-oil'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'wok',
      difficulty: 'easy',
      prepTimeMin: 20,
      hint: 'Pollo glaseado con salsa teriyaki casera al wok, sobre arroz y brócoli al vapor.'
   },
   {
      id: 'salteado-camarones',
      name: 'Salteado de camarones al wok',
      cuisine: 'asiatica',
      baseIngredients: {
         protein: 'shrimp',
         carb: 'rice-white',
         vegetable: 'bell-pepper-red',
         fat: 'sunflower-oil'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'wok',
      difficulty: 'medium',
      prepTimeMin: 18,
      hint: 'Camarones salteados con pimentón y cebolla al wok, sobre arroz blanco.'
   },
   {
      id: 'bowl-tofu',
      name: 'Bowl asiático de tofu',
      cuisine: 'asiatica',
      baseIngredients: { protein: 'tofu', carb: 'quinoa', vegetable: 'spinach', fat: 'chia-seeds' },
      mealTypes: ['lunch', 'dinner'],
      technique: 'wok',
      difficulty: 'easy',
      prepTimeMin: 20,
      hint: 'Bowl con tofu marinado, quinua y espinaca salteada con jengibre.'
   },

   /* ============================
    *  🇪🇸 / 🇮🇹 — MEDITERRÁNEA
    * ============================ */
   {
      id: 'salmon-horno',
      name: 'Salmón al horno con verduras',
      cuisine: 'mediterranea',
      baseIngredients: {
         protein: 'salmon-fresh',
         carb: 'potato',
         vegetable: 'zucchini',
         fat: 'olive-oil'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'horno',
      difficulty: 'easy',
      prepTimeMin: 25,
      hint: 'Salmón al horno con limón, papa y calabacín, plato saludable estilo mediterráneo.'
   },
   {
      id: 'pasta-pollo-pesto',
      name: 'Pasta integral con pollo al pesto',
      cuisine: 'mediterranea',
      baseIngredients: {
         protein: 'chicken-breast',
         carb: 'pasta-cooked',
         vegetable: 'spinach',
         fat: 'olive-oil'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'salteado',
      difficulty: 'easy',
      prepTimeMin: 20,
      hint: 'Pasta integral con pollo salteado, espinaca y pesto casero suave.'
   },
   {
      id: 'ensalada-atun',
      name: 'Ensalada mediterránea de atún',
      cuisine: 'mediterranea',
      baseIngredients: {
         protein: 'tuna-can',
         carb: 'chickpeas',
         vegetable: 'tomato',
         fat: 'olive-oil'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'frio',
      difficulty: 'easy',
      prepTimeMin: 10,
      hint: 'Ensalada fría con atún, garbanzos, tomate y limón, sin cocción.'
   },
   {
      id: 'tostada-mediterranea',
      name: 'Tostada mediterránea',
      cuisine: 'mediterranea',
      baseIngredients: {
         protein: 'queso-fresco',
         carb: 'bread-whole',
         vegetable: 'tomato',
         fat: 'olive-oil'
      },
      mealTypes: ['breakfast', 'snack_am'],
      technique: 'plancha',
      difficulty: 'easy',
      prepTimeMin: 8,
      hint: 'Tostada de pan integral con tomate fresco rallado, queso y un hilo de oliva.'
   },
   {
      id: 'frittata-vegetales',
      name: 'Frittata de vegetales',
      cuisine: 'mediterranea',
      baseIngredients: { protein: 'eggs', carb: 'potato', vegetable: 'spinach', fat: 'olive-oil' },
      mealTypes: ['breakfast', 'lunch'],
      technique: 'horno',
      difficulty: 'easy',
      prepTimeMin: 20,
      hint: 'Tortilla italiana de huevo con espinaca y papa, terminada al horno.'
   },

   /* ============================
    *  🇵🇷 / 🇨🇺 / 🇩🇴 — CARIBEÑA (Sprint 11.6)
    * ============================ */
   {
      id: 'mofongo-con-pollo',
      name: 'Mofongo con pollo',
      cuisine: 'caribena',
      baseIngredients: {
         protein: 'chicken-breast',
         carb: 'plantain',
         fat: 'olive-oil',
         vegetable: 'garlic'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'guiso',
      difficulty: 'medium',
      prepTimeMin: 35,
      hint: 'Plátano verde majado con ajo, servido con pollo guisado boricua.'
   },
   {
      id: 'arroz-con-habichuelas',
      name: 'Arroz con habichuelas guisadas',
      cuisine: 'caribena',
      baseIngredients: {
         protein: 'beans-red',
         carb: 'rice-white',
         fat: 'olive-oil',
         vegetable: 'onion'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'guiso',
      difficulty: 'easy',
      prepTimeMin: 25,
      hint: 'Combo clásico boricua-dominicano: arroz blanco con habichuelas guisadas con sofrito.'
   },
   {
      id: 'ropa-vieja-platano',
      name: 'Ropa vieja con plátano maduro',
      cuisine: 'caribena',
      baseIngredients: {
         protein: 'beef-lean',
         carb: 'plantain',
         fat: 'olive-oil',
         vegetable: 'red-pepper'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'guiso',
      difficulty: 'medium',
      prepTimeMin: 40,
      hint: 'Falda deshebrada en sofrito cubano, acompañada de plátano maduro al sartén.'
   },
   {
      id: 'mangu-dominicano',
      name: 'Mangú dominicano con huevo',
      cuisine: 'caribena',
      baseIngredients: {
         protein: 'eggs',
         carb: 'plantain',
         fat: 'olive-oil',
         vegetable: 'onion'
      },
      mealTypes: ['breakfast', 'lunch'],
      technique: 'hervido',
      difficulty: 'easy',
      prepTimeMin: 20,
      hint: 'Puré de plátano verde hervido, cebolla encurtida y huevo frito. Desayuno DR clásico.'
   },

   /* ============================
    *  🇦🇷 / 🇺🇾 — RIOPLATENSE (Sprint 11.6, dentro de cono_sur)
    * ============================ */
   {
      id: 'milanesa-napolitana-horno',
      name: 'Milanesa napolitana al horno',
      cuisine: 'cono_sur',
      baseIngredients: {
         protein: 'chicken-breast',
         carb: 'potato',
         fat: 'olive-oil',
         vegetable: 'tomato'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'horno',
      difficulty: 'medium',
      prepTimeMin: 35,
      hint: 'Milanesa empanada al horno con salsa de tomate y queso, papas al horno como guarnición.'
   },
   {
      id: 'asado-con-ensalada',
      name: 'Asado argentino con ensalada criolla',
      cuisine: 'cono_sur',
      baseIngredients: {
         protein: 'beef-lean',
         carb: 'rice-white',
         fat: 'olive-oil',
         vegetable: 'tomato'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'plancha',
      difficulty: 'easy',
      prepTimeMin: 30,
      hint: 'Corte magro a la plancha + ensalada de tomate, cebolla y pimentón con vinagreta.'
   },
   {
      id: 'choripan-casero',
      name: 'Choripán casero con chimichurri',
      cuisine: 'cono_sur',
      baseIngredients: {
         protein: 'chicken-breast',
         carb: 'bread-whole-grain',
         fat: 'olive-oil',
         vegetable: 'parsley'
      },
      mealTypes: ['lunch', 'snack_pm'],
      technique: 'plancha',
      difficulty: 'easy',
      prepTimeMin: 15,
      hint: 'Pan integral con proteína a la plancha y chimichurri casero (perejil, ajo, aceite, vinagre).'
   },

   /* ============================
    *  🇵🇾 — PARAGUAYA (Sprint 11.6)
    * ============================ */
   {
      id: 'sopa-paraguaya',
      name: 'Sopa paraguaya horneada',
      cuisine: 'paraguaya',
      baseIngredients: {
         protein: 'eggs',
         carb: 'corn-flour',
         fat: 'olive-oil',
         vegetable: 'onion'
      },
      mealTypes: ['lunch', 'dinner', 'snack_pm'],
      technique: 'horno',
      difficulty: 'medium',
      prepTimeMin: 45,
      hint: 'Pastel salado paraguayo de harina de maíz, queso y cebolla. Sí, es sólido. Tradición pura.'
   },
   {
      id: 'bori-bori',
      name: 'Bori-bori (sopa con bolitas de maíz)',
      cuisine: 'paraguaya',
      baseIngredients: {
         protein: 'chicken-breast',
         carb: 'corn-flour',
         fat: 'olive-oil',
         vegetable: 'carrot'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'hervido',
      difficulty: 'medium',
      prepTimeMin: 40,
      hint: 'Sopa paraguaya con pollo, vegetales y bolitas de harina de maíz con queso. Reconfortante.'
   },

   /* ============================
    *  🇻🇪 — VENEZOLANO (extiende andina, Sprint 11.6)
    * ============================ */
   {
      id: 'pabellon-criollo',
      name: 'Pabellón criollo con plátano',
      cuisine: 'andina',
      baseIngredients: {
         protein: 'beef-lean',
         carb: 'rice-white',
         fat: 'olive-oil',
         vegetable: 'beans-black'
      },
      mealTypes: ['lunch', 'dinner'],
      technique: 'guiso',
      difficulty: 'medium',
      prepTimeMin: 40,
      hint: 'Plato nacional venezolano: carne mechada, arroz blanco, caraotas negras y plátano maduro.'
   },
   {
      id: 'arepa-rellena',
      name: 'Arepa rellena de pollo y palta',
      cuisine: 'andina',
      baseIngredients: {
         protein: 'chicken-breast',
         carb: 'corn-flour',
         fat: 'avocado',
         vegetable: 'tomato'
      },
      mealTypes: ['breakfast', 'lunch', 'dinner'],
      technique: 'plancha',
      difficulty: 'easy',
      prepTimeMin: 20,
      hint: 'Arepa de maíz blanco a la plancha rellena con pollo desmechado y palta en cubitos.'
   }
]

/** Devuelve los dishes que matchean las cocinas favoritas del usuario. */
export const filterDishesByCuisines = (
   cuisines: ItfCuisine[],
   mealType?: ItfMealType
): ItfCanonicalDish[] => {
   let pool = CANONICAL_DISHES
   if (cuisines.length > 0) {
      pool = pool.filter((d) => cuisines.includes(d.cuisine))
   }
   if (mealType) {
      pool = pool.filter((d) => d.mealTypes.includes(mealType))
   }
   return pool
}
