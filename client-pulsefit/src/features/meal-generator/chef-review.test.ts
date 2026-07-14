import { describe, it, expect } from 'vitest'
import { reviewByChef, CHEF_RULE_NAMES } from './chef-review'
import type { ItfPlateOption } from './types'

const plate = (over: Partial<ItfPlateOption> = {}): ItfPlateOption => ({
   name: 'Bowl casero',
   description: 'Plato balanceado',
   prep_time_min: 20,
   difficulty: 'easy',
   steps: [
      'Cocina el arroz en una olla con agua y sal.',
      'Cocina la pechuga en sartén con aceite.',
      'Sirve en un bowl con las verduras al lado.'
   ],
   ...over
})

describe('Chef Diego — Sprint 11.15', () => {
   it('aprueba un plato normal (pollo + arroz)', () => {
      const r = reviewByChef(plate())
      expect(r.approved).toBe(true)
   })

   it('RECHAZA el caso reportado: "Mezcla proteína en polvo con limón y hierbas"', () => {
      const bug = plate({
         name: 'Bowl Criollo',
         description: 'Un plato unificado con proteína en polvo y arepa',
         steps: [
            'Cocina la arepa de maíz en una sartén con ajo y sal hasta dorar.',
            'Mezcla la proteína en polvo con un poco de limón y hierbas frescas.',
            'Agrega las nueces picadas sobre la arepa cocida.',
            'Sirve la proteína mezclada sobre la arepa.'
         ]
      })
      const r = reviewByChef(bug)
      expect(r.approved).toBe(false)
      expect(r.reason).toBeDefined()
   })

   it('RECHAZA polvo cocinado en caliente', () => {
      const r = reviewByChef(
         plate({
            steps: [
               'Cocina la proteína en polvo en una sartén con aceite hasta dorar.',
               'Sirve caliente.',
               'Decora con hierbas.'
            ]
         })
      )
      expect(r.approved).toBe(false)
      expect(r.ruleName).toBe('polvo_en_caliente')
   })

   it('RECHAZA polvo + limón (coagulación)', () => {
      const r = reviewByChef(
         plate({
            steps: [
               'Mezcla la proteína en polvo con jugo de limón fresco en un tazón grande.',
               'Sirve frío en un vaso alto.',
               'Decora con menta encima del vaso.'
            ]
         })
      )
      expect(r.approved).toBe(false)
      expect(r.ruleName).toBe('polvo_con_acido')
   })

   it('RECHAZA polvo sazonado con sal, ajo o hierbas', () => {
      const r = reviewByChef(
         plate({
            steps: [
               'Mezcla la proteína en polvo con sal, ajo y perejil en un bowl.',
               'Sirve inmediatamente para conservar el sabor.',
               'Acompaña con arroz cocido.'
            ]
         })
      )
      expect(r.approved).toBe(false)
      expect(r.ruleName).toBe('polvo_sazonado_salado')
   })

   it('RECHAZA polvo servido sobre arepa/pan/tortilla', () => {
      const r = reviewByChef(
         plate({
            name: 'Bowl con polvo sobre la arepa',
            steps: [
               'Mezcla el whey en polvo con agua fresca en un shaker durante treinta segundos.',
               'Vierte el polvo mezclado sobre la arepa recién hecha y decora con nueces picadas.',
               'Sirve el plato listo inmediatamente para conservar textura de la mezcla.'
            ]
         })
      )
      expect(r.approved).toBe(false)
      expect(r.ruleName).toBe('polvo_sobre_plato')
   })

   it('RECHAZA nombres robóticos ("plato unificado", "combinación de")', () => {
      const r = reviewByChef(
         plate({
            name: 'Plato unificado de pollo con arroz',
            description: 'Un plato unificado y balanceado'
         })
      )
      expect(r.approved).toBe(false)
      expect(r.ruleName).toBe('nombre_robotico')
   })

   it('RECHAZA lechuga/pepino cocinados en caliente', () => {
      const r = reviewByChef(
         plate({
            steps: [
               'Cocina el arroz hasta su punto perfecto en una olla con agua salada.',
               'Hornea la lechuga con aceite durante quince minutos a 180 grados.',
               'Sirve el arroz junto con la lechuga horneada crujiente y aromática.'
            ]
         })
      )
      expect(r.approved).toBe(false)
      expect(r.ruleName).toBe('verdura_cruda_cocida')
   })

   it('APRUEBA polvo en batido con líquido (uso correcto)', () => {
      const r = reviewByChef(
         plate({
            name: 'Batido casero de plátano con whey',
            steps: [
               'Coloca la proteína en polvo en la licuadora con 250ml de leche fría.',
               'Agrega media banana congelada y una cucharada de mantequilla de maní.',
               'Licúa 30 segundos hasta que quede cremoso y sin grumos.',
               'Sirve inmediatamente en un vaso alto decorado con canela.'
            ]
         })
      )
      expect(r.approved).toBe(true)
   })

   it('todas las reglas tienen nombre único', () => {
      const set = new Set(CHEF_RULE_NAMES)
      expect(set.size).toBe(CHEF_RULE_NAMES.length)
      expect(CHEF_RULE_NAMES.length).toBeGreaterThan(5)
   })

   /* ============================================================
    *  Sprint 11.16b: nuevas reglas anti-bug reportado por usuario
    * ============================================================ */

   it('RECHAZA el caso reportado: gramos en steps ("Sazona 220g de tofu")', () => {
      const bug = plate({
         name: 'Bowl casero de tofu con plátano maduro',
         steps: [
            'Cocina 105g de plátano maduro con sal hasta su punto.',
            'Sazona 220g de tofu con sal, pimienta, ajo y comino.',
            'Calienta 10g de aceite de girasol y cocina la proteína cinco minutos.',
            'Saltea 120g de tomate hasta tierno.'
         ]
      })
      const r = reviewByChef(bug)
      expect(r.approved).toBe(false)
      expect(r.ruleName).toBe('gramos_en_steps')
   })

   it('RECHAZA gramos con distintas notaciones (g, gr, gramos)', () => {
      const variants = [
         'Cocina 100g de arroz suave.',
         'Sazona 250 gramos de pollo con sal.',
         'Agrega 15gr de aceite y mezcla bien.'
      ]
      for (const step of variants) {
         const r = reviewByChef(
            plate({
               steps: [
                  step,
                  'Prepara los demás ingredientes con cuidado en la cocina.',
                  'Sirve el plato caliente inmediatamente al terminar la preparación.'
               ]
            })
         )
         expect(r.approved).toBe(false)
         expect(r.ruleName).toBe('gramos_en_steps')
      }
   })

   it('APRUEBA steps sin gramos (formato correcto)', () => {
      const r = reviewByChef(
         plate({
            name: 'Bowl casero de tofu con plátano maduro',
            steps: [
               'Corta el plátano maduro en rodajas y reserva sobre un plato.',
               'Sazona el tofu con pimienta, ajo y comino recién molido.',
               'Calienta el aceite y cocina el tofu unos cinco minutos por lado.',
               'Sirve todo en un bowl con limón fresco y hierbas.'
            ]
         })
      )
      expect(r.approved).toBe(true)
   })

   it('RECHAZA tomate "tierno-crocante" (contradictorio)', () => {
      const r = reviewByChef(
         plate({
            steps: [
               'Corta el tomate en cubos grandes y reserva sobre un plato limpio.',
               'Calienta el aceite en sartén a fuego medio hasta que esté caliente.',
               'Saltea el tomate hasta tierno-crocante durante cuatro minutos removiendo.',
               'Sirve inmediatamente en un plato con hierbas frescas encima.'
            ]
         })
      )
      expect(r.approved).toBe(false)
      expect(r.ruleName).toBe('tomate_tierno_crocante')
   })

   it('RECHAZA plátano maduro cocinado con sal', () => {
      const r = reviewByChef(
         plate({
            steps: [
               'Cocina el plátano maduro con sal hasta que esté en su punto.',
               'Calienta el aceite en sartén y agrega la proteína elegida.',
               'Combina todo en un plato hondo con hierbas frescas al final.'
            ]
         })
      )
      expect(r.approved).toBe(false)
      expect(r.ruleName).toBe('dulce_cocido_con_sal')
   })

   /* ============================================================
    *  Sprint 11.17b: yogurt + carb incompatible
    * ============================================================ */

   it('RECHAZA el bug reportado: "Bowl frío de yogurt con pan integral"', () => {
      const bug = plate({
         name: 'Bowl frío de yogurt con pan integral',
         description: 'Snack saludable y rápido.',
         steps: [
            'Coloca el yogurt griego natural en un bowl grande y frío.',
            'Mezcla el yogurt con el pan integral cortado en cubos pequeños.',
            'Suma las nueces picadas por encima para darle textura crocante.',
            'Endulza con miel o canela al gusto de cada persona.',
            'Sirve frío inmediatamente para conservar la textura fresca.'
         ]
      })
      const r = reviewByChef(bug)
      expect(r.approved).toBe(false)
      expect(r.ruleName).toBe('yogurt_con_carb_incompatible')
   })

   it('RECHAZA yogurt con tostada / arepa / arroz / pasta', () => {
      const carbs = ['tostada', 'arepa', 'arroz blanco', 'pasta cocida']
      for (const c of carbs) {
         const r = reviewByChef(
            plate({
               name: `Bowl de yogurt con ${c}`,
               steps: [
                  `Coloca el yogurt fresco en un bowl grande y transparente.`,
                  `Combina el yogurt con el ${c} en pedazos pequeños dentro del bowl.`,
                  `Añade las semillas por encima y sirve inmediatamente frío.`
               ]
            })
         )
         expect(r.approved).toBe(false)
         expect(r.ruleName).toBe('yogurt_con_carb_incompatible')
      }
   })

   it('APRUEBA yogurt con granola / avena / cereal / muesli', () => {
      const goodCarbs = ['granola', 'avena', 'cereal', 'muesli']
      for (const c of goodCarbs) {
         const r = reviewByChef(
            plate({
               name: `Parfait de yogurt con ${c}`,
               steps: [
                  `Coloca el yogurt fresco en un vaso alto y transparente.`,
                  `Alterna capas de yogurt con la ${c} crocante por encima.`,
                  `Decora con nueces picadas y una pizca de canela dulce.`
               ]
            })
         )
         expect(r.approved).toBe(true)
      }
   })
})
