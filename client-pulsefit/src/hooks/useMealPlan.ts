import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fntGenerateMealPlan, fntGetCurrentMealPlan } from '@/api/fntMealPlan'
import { useErrorHandling } from './useErrorHandling'
import { useAuth } from './useAuth'
import type { ItfGenerateMealPlanParams, ItfMealPlan } from '@/interface/itfMeals'

const PLAN_QUERY_KEY = ['meal-plan', 'current'] as const

/**
 * Lee el plan vigente del usuario (el último creado).
 * Se invalida automáticamente cuando se genera uno nuevo.
 */
export const useMealPlan = () => {
   const { user, onboardingCompleted } = useAuth()
   return useQuery<ItfMealPlan | null>({
      queryKey: PLAN_QUERY_KEY,
      queryFn: fntGetCurrentMealPlan,
      enabled: !!user && onboardingCompleted,
      staleTime: 5 * 60 * 1000 /* 5 min — el plan no cambia hasta que se regenera */
   })
}

/**
 * Genera un plan completo de N días (1-7) en una sola operación.
 * El plan rota 3 recetas por meal_type a lo largo de los días y la suma
 * calórica diaria es EXACTA al target del usuario.
 */
export const useGenerateMealPlan = () => {
   const queryClient = useQueryClient()
   const { handleApiError } = useErrorHandling()

   return useMutation<ItfMealPlan, Error, ItfGenerateMealPlanParams>({
      mutationFn: fntGenerateMealPlan,
      onSuccess: (plan) => {
         queryClient.setQueryData(PLAN_QUERY_KEY, plan)
         if (plan.source === 'fallback') {
            toast('Tu plan está listo con recetas simples 🌿', {
               description: 'Pronto volveremos con más creatividad.'
            })
         } else if (plan.source === 'mixed') {
            toast.success(`Tu plan de ${plan.days} días está listo 🌱`, {
               description: 'Algunas recetas salieron con plantilla.'
            })
         } else {
            toast.success(`Tu plan de ${plan.days} días está listo 🌱`)
         }
      },
      onError: (e) => handleApiError(e)
   })
}
