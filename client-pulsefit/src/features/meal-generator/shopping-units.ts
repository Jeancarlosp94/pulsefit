/**
 * Mapa de unidades comerciales típicas LATAM. Convierte gramos del motor
 * a cantidades comprables reales en el supermercado/mercado.
 *
 * Firmado por Diego (chef): los pesos son promedios de mercado real LATAM,
 * no estandarizados USDA. Un huevo grande son ~55g, una pechuga de pollo
 * mediana ~200g, etc.
 *
 * Cuando el ingredient no está acá, el conversor cae a kg/g/ml directos.
 */

export interface ItfShoppingUnit {
   /** Peso aproximado de UNA unidad comercial común. */
   unitGrams: number
   singular: string
   plural: string
   /** Si el ingrediente se vende típicamente por peso (arroz, azúcar), usar 'kg'/'g'. */
   sellAs?: 'unit' | 'kg' | 'g' | 'paquete'
}

export const SHOPPING_UNITS: Record<string, ItfShoppingUnit> = {
   /* === PROTEÍNAS === */
   'chicken-breast': { unitGrams: 200, singular: 'pechuga', plural: 'pechugas', sellAs: 'unit' },
   'beef-lean': { unitGrams: 250, singular: 'bife', plural: 'bifes', sellAs: 'g' },
   'fish-tilapia': { unitGrams: 180, singular: 'filete', plural: 'filetes', sellAs: 'unit' },
   'salmon-fresh': { unitGrams: 180, singular: 'porción', plural: 'porciones', sellAs: 'g' },
   eggs: { unitGrams: 55, singular: 'huevo', plural: 'huevos', sellAs: 'unit' },
   'tuna-can': { unitGrams: 120, singular: 'lata', plural: 'latas', sellAs: 'unit' },
   shrimp: { unitGrams: 100, singular: 'paquete chico', plural: 'paquetes', sellAs: 'g' },
   'ham-turkey': { unitGrams: 100, singular: 'paquete', plural: 'paquetes', sellAs: 'g' },
   'ham-cooked-low-sodium': {
      unitGrams: 100,
      singular: 'paquete',
      plural: 'paquetes',
      sellAs: 'g'
   },
   'greek-yogurt': { unitGrams: 170, singular: 'pote', plural: 'potes', sellAs: 'unit' },
   'cottage-cheese': { unitGrams: 200, singular: 'pote', plural: 'potes', sellAs: 'unit' },
   'queso-fresco': { unitGrams: 250, singular: 'porción', plural: 'porciones', sellAs: 'g' },
   ricotta: { unitGrams: 250, singular: 'pote', plural: 'potes', sellAs: 'g' },
   'whey-protein': { unitGrams: 30, singular: 'scoop', plural: 'scoops', sellAs: 'paquete' },
   tofu: { unitGrams: 300, singular: 'paquete', plural: 'paquetes', sellAs: 'g' },
   'lentils-cooked': { unitGrams: 400, singular: 'lata', plural: 'latas', sellAs: 'unit' },
   chickpeas: { unitGrams: 400, singular: 'lata', plural: 'latas', sellAs: 'unit' },
   'black-beans': { unitGrams: 400, singular: 'lata', plural: 'latas', sellAs: 'unit' },

   /* === CARBOHIDRATOS === */
   'rice-white': { unitGrams: 80, singular: 'porción seca', plural: 'porciones', sellAs: 'kg' },
   'pasta-cooked': { unitGrams: 80, singular: 'porción seca', plural: 'porciones', sellAs: 'kg' },
   oats: { unitGrams: 40, singular: 'porción', plural: 'porciones', sellAs: 'kg' },
   'oats-bran': { unitGrams: 30, singular: 'porción', plural: 'porciones', sellAs: 'paquete' },
   granola: { unitGrams: 50, singular: 'porción', plural: 'porciones', sellAs: 'paquete' },
   quinoa: { unitGrams: 80, singular: 'porción seca', plural: 'porciones', sellAs: 'kg' },
   potato: { unitGrams: 150, singular: 'papa', plural: 'papas', sellAs: 'unit' },
   'sweet-potato': { unitGrams: 200, singular: 'camote', plural: 'camotes', sellAs: 'unit' },
   plantain: { unitGrams: 180, singular: 'plátano', plural: 'plátanos', sellAs: 'unit' },
   yuca: { unitGrams: 250, singular: 'trozo', plural: 'trozos', sellAs: 'g' },
   'bread-whole': { unitGrams: 30, singular: 'rebanada', plural: 'rebanadas', sellAs: 'unit' },
   'tortilla-maiz': { unitGrams: 25, singular: 'tortilla', plural: 'tortillas', sellAs: 'unit' },
   'arepa-blanca': { unitGrams: 100, singular: 'arepa', plural: 'arepas', sellAs: 'unit' },

   /* === GRASAS === */
   'olive-oil': { unitGrams: 13, singular: 'cucharada', plural: 'cucharadas', sellAs: 'paquete' },
   'sunflower-oil': {
      unitGrams: 13,
      singular: 'cucharada',
      plural: 'cucharadas',
      sellAs: 'paquete'
   },
   'butter-unsalted': {
      unitGrams: 14,
      singular: 'cucharadita',
      plural: 'cucharaditas',
      sellAs: 'paquete'
   },
   avocado: { unitGrams: 170, singular: 'aguacate', plural: 'aguacates', sellAs: 'unit' },
   'peanut-butter': {
      unitGrams: 16,
      singular: 'cucharada',
      plural: 'cucharadas',
      sellAs: 'paquete'
   },
   walnuts: { unitGrams: 25, singular: 'puñado', plural: 'puñados', sellAs: 'g' },
   almonds: { unitGrams: 25, singular: 'puñado', plural: 'puñados', sellAs: 'g' },
   'chia-seeds': { unitGrams: 12, singular: 'cucharada', plural: 'cucharadas', sellAs: 'paquete' },

   /* === VEGETALES === */
   broccoli: { unitGrams: 300, singular: 'cabeza', plural: 'cabezas', sellAs: 'unit' },
   spinach: { unitGrams: 200, singular: 'atado', plural: 'atados', sellAs: 'g' },
   tomato: { unitGrams: 130, singular: 'tomate', plural: 'tomates', sellAs: 'unit' },
   lettuce: { unitGrams: 300, singular: 'lechuga', plural: 'lechugas', sellAs: 'unit' },
   zucchini: { unitGrams: 200, singular: 'zapallito', plural: 'zapallitos', sellAs: 'unit' },
   onion: { unitGrams: 150, singular: 'cebolla', plural: 'cebollas', sellAs: 'unit' },
   'bell-pepper-red': {
      unitGrams: 150,
      singular: 'pimentón',
      plural: 'pimentones',
      sellAs: 'unit'
   },
   carrot: { unitGrams: 120, singular: 'zanahoria', plural: 'zanahorias', sellAs: 'unit' },
   'corn-fresh': { unitGrams: 200, singular: 'choclo', plural: 'choclos', sellAs: 'unit' },
   'aji-dulce': { unitGrams: 30, singular: 'ají', plural: 'ajíes', sellAs: 'unit' },
   'green-beans': { unitGrams: 100, singular: 'puñado', plural: 'puñados', sellAs: 'g' },

   /* === FRUTAS === */
   banana: { unitGrams: 120, singular: 'banana', plural: 'bananas', sellAs: 'unit' },
   apple: { unitGrams: 150, singular: 'manzana', plural: 'manzanas', sellAs: 'unit' },
   'berries-mix': { unitGrams: 125, singular: 'paquete', plural: 'paquetes', sellAs: 'g' },
   mango: { unitGrams: 200, singular: 'mango', plural: 'mangos', sellAs: 'unit' },
   papaya: { unitGrams: 400, singular: 'papaya', plural: 'papayas', sellAs: 'unit' },
   pineapple: { unitGrams: 900, singular: 'piña', plural: 'piñas', sellAs: 'unit' },

   /* === CONDIMENTOS === */
   garlic: { unitGrams: 5, singular: 'diente', plural: 'dientes', sellAs: 'unit' },
   lemon: { unitGrams: 60, singular: 'limón', plural: 'limones', sellAs: 'unit' },
   salt: { unitGrams: 5, singular: 'pizca', plural: 'pizcas', sellAs: 'paquete' }
}

/**
 * Convierte gramos totales a una cadena humana: "3 pechugas (~600g)",
 * "1 paquete (~250g)", "300g", etc.
 */
export const formatQuantity = (ingredientId: string, totalGrams: number): string => {
   const unit = SHOPPING_UNITS[ingredientId]
   if (!unit || unit.sellAs === 'kg' || unit.sellAs === 'g') {
      /* Vendido por peso. */
      if (totalGrams >= 1000) {
         const kg = Math.round((totalGrams / 1000) * 10) / 10
         return `${kg} kg`
      }
      return `${Math.round(totalGrams)} g`
   }

   const count = Math.max(1, Math.round(totalGrams / unit.unitGrams))
   const label = count === 1 ? unit.singular : unit.plural
   const approx = `~${Math.round(totalGrams)}g`
   if (unit.sellAs === 'paquete') {
      /* Para aceites, mantequilla de maní, etc. mostramos solo la cantidad aprox. */
      return `${approx}`
   }
   return `${count} ${label} (${approx})`
}
