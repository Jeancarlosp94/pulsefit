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
})
