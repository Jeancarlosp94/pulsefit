import { describe, it, expect } from 'vitest'
import { getModalityNutritionTip } from './modality-tips'
import type { ItfModality } from '@/interface/itfPrograms'

describe('getModalityNutritionTip — Sprint 11.14', () => {
   const modalities: ItfModality[] = [
      'hiit',
      'gym',
      'calistenia',
      'yoga',
      'barre',
      'pilates',
      'crossfit',
      'running',
      'cycling',
      'swimming',
      'sport',
      'hybrid'
   ]

   it('devuelve un tip completo para TODAS las modalidades', () => {
      for (const m of modalities) {
         const tip = getModalityNutritionTip(m)
         expect(tip.headline).toBeTruthy()
         expect(tip.detail).toBeTruthy()
         expect(tip.emoji).toBeTruthy()
      }
   })

   it('headline < 90 chars y detail < 160 chars (UI-safe)', () => {
      for (const m of modalities) {
         const tip = getModalityNutritionTip(m)
         expect(tip.headline.length).toBeLessThanOrEqual(90)
         expect(tip.detail.length).toBeLessThanOrEqual(160)
      }
   })

   it('HIIT y CrossFit mencionan timing carbos/proteína', () => {
      expect(getModalityNutritionTip('hiit').detail).toMatch(/carbos|proteína/i)
      expect(getModalityNutritionTip('crossfit').detail).toMatch(/carbos|proteína/i)
   })

   it('Yoga y Pilates mencionan estómago cómodo/tiempo antes de práctica', () => {
      expect(getModalityNutritionTip('yoga').detail).toMatch(/min|hidrat|ligera|antes/i)
      expect(getModalityNutritionTip('pilates').detail).toMatch(/min|ligera|antes/i)
   })

   it('NO contiene lenguaje prescriptivo médico o gramaje específico', () => {
      const forbidden = /\d+\s*g\/?día|debes\s+consumir|prescribo|dosis/i
      for (const m of modalities) {
         const tip = getModalityNutritionTip(m)
         expect(tip.headline).not.toMatch(forbidden)
         expect(tip.detail).not.toMatch(forbidden)
      }
   })
})
