import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Flame, Droplets, Sparkles, AlertTriangle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { OnboardingLayout, RealityCheckCard } from '@/components/onboarding'
import { useOnboardingStore } from '@/store/onboarding'
import { useAuth } from '@/hooks/useAuth'
import { useErrorHandling } from '@/hooks/useErrorHandling'
import {
   computeNutritionSummary,
   validateNutritionPlan,
   type ItfValidationResult
} from '@/features/nutrition-engine'

const Step7Review = () => {
   const navigate = useNavigate()
   const { data, back, reset } = useOnboardingStore()
   const { updateProfile } = useAuth()
   const { handleApiError } = useErrorHandling()
   const [submitting, setSubmitting] = useState(false)

   const summary = useMemo(() => {
      if (
         !data.currentWeightKg ||
         !data.heightCm ||
         !data.age ||
         !data.sex ||
         !data.activityLevel ||
         !data.goal
      ) {
         return null
      }
      return computeNutritionSummary({
         weightKg: data.currentWeightKg,
         heightCm: data.heightCm,
         age: data.age,
         sex: data.sex,
         activityLevel: data.activityLevel,
         goal: data.goal
      })
   }, [data])

   const validation: ItfValidationResult | null = useMemo(() => {
      if (!summary || !data.sex || !data.currentWeightKg) return null
      const targetWeight = data.targetWeightKg ?? data.currentWeightKg
      let weeksToGoal = 8
      if (data.targetDate) {
         const target = new Date(data.targetDate).getTime()
         const now = Date.now()
         weeksToGoal = Math.max(2, Math.round((target - now) / (7 * 24 * 60 * 60 * 1000)))
      }
      return validateNutritionPlan({
         sex: data.sex,
         targetKcal: summary.targetKcal,
         currentWeightKg: data.currentWeightKg,
         targetWeightKg: targetWeight,
         weeksToGoal
      })
   }, [summary, data])

   const blocked = !!validation && !validation.ok
   const fail = validation && !validation.ok ? validation : null
   const hasMedical = data.medicalConditions.length > 0 && !data.medicalConditions.includes('none')

   const handleBack = () => {
      back()
      navigate('/onboarding/6')
   }

   const onConfirm = async () => {
      if (!summary || blocked) return
      const now = new Date().toISOString()
      setSubmitting(true)
      try {
         await updateProfile({
            age: data.age,
            date_of_birth: data.dateOfBirth,
            eating_disorder_history: data.eatingDisorderHistory,
            lifestyle: data.lifestyle,
            monotonous_meals_preferred: data.monotonousMealsPreferred,
            sex: data.sex,
            height_cm: data.heightCm,
            current_weight_kg: data.currentWeightKg,
            initial_weight_kg: data.currentWeightKg,
            target_weight_kg: data.targetWeightKg,
            target_date: data.targetDate,
            goal: data.goal,
            activity_level: data.activityLevel,
            fitness_level: data.fitnessLevel,
            available_days: data.availableDays,
            available_minutes: data.availableMinutes,
            equipment: data.equipment,
            cooks_at_home: data.cooksAtHome,
            dietary_restrictions: data.dietaryRestrictions,
            allergies: data.allergies || null,
            disliked_foods: data.dislikedFoods,
            budget_level: data.budgetLevel,
            meals_per_day: data.mealsPerDay,
            favorite_cuisines: data.favoriteCuisines,
            favorite_ingredient_ids: data.favoriteIngredientIds,
            medical_conditions: data.medicalConditions,
            tmb: summary.tmb,
            get_kcal: summary.getKcal,
            target_kcal: summary.targetKcal,
            target_protein_g: summary.proteinG,
            target_carbs_g: summary.carbsG,
            target_fats_g: summary.fatsG,
            onboarding_completed: true,
            accepted_terms_at: data.acceptedTerms ? now : null,
            accepted_privacy_at: data.acceptedPrivacy ? now : null
         })
         toast.success('¡Listo! Tu PulseFit te espera 🌱')
         reset()
         navigate('/home', { replace: true })
      } catch (e) {
         handleApiError(e)
      } finally {
         setSubmitting(false)
      }
   }

   if (!summary) {
      return (
         <OnboardingLayout step={7} title='Casi…'>
            <Card>
               <CardContent className='pt-6 text-center text-sm text-muted-foreground'>
                  Faltan algunos datos para calcular tu plan. Volvamos atrás para completarlos.
                  <Button
                     variant='ghost'
                     className='mt-4'
                     onClick={() => navigate('/onboarding/2')}
                  >
                     Revisar pasos anteriores
                  </Button>
               </CardContent>
            </Card>
         </OnboardingLayout>
      )
   }

   return (
      <OnboardingLayout
         step={7}
         title='Tu plan está listo'
         subtitle='Estos números son tu punto de partida. Los ajustaremos cada semana.'
      >
         <div className='space-y-4'>
            {fail ? (
               <Card className='border-accent/40 bg-accent/5'>
                  <CardContent className='flex items-start gap-3 pt-6 text-sm'>
                     <AlertTriangle
                        className='mt-0.5 h-5 w-5 shrink-0 text-accent'
                        aria-hidden='true'
                     />
                     <div className='space-y-2'>
                        <p className='font-medium text-foreground'>{fail.message}</p>
                        <Button
                           size='sm'
                           variant='outline'
                           onClick={() => navigate('/onboarding/2')}
                        >
                           Ajustar mi meta
                        </Button>
                     </div>
                  </CardContent>
               </Card>
            ) : null}

            {/* Sprint 11.5B: pantalla didáctica pre-plan que normaliza expectativas. */}
            <RealityCheckCard />

            <Card>
               <CardHeader>
                  <CardTitle className='text-xl'>Tu energía diaria</CardTitle>
               </CardHeader>
               <CardContent className='space-y-3 text-sm'>
                  <div className='flex items-center gap-3'>
                     <Flame className='h-5 w-5 text-primary' aria-hidden='true' />
                     <div className='flex-1'>
                        <p className='text-muted-foreground'>Calorías objetivo</p>
                        <p className='font-display text-2xl text-foreground'>
                           {summary.targetKcal} kcal
                        </p>
                     </div>
                  </div>
                  <Separator />
                  <div className='grid grid-cols-3 gap-2 text-center'>
                     <div>
                        <p className='text-xs text-muted-foreground'>Proteína</p>
                        <p className='text-base font-medium text-foreground'>{summary.proteinG}g</p>
                     </div>
                     <div>
                        <p className='text-xs text-muted-foreground'>Carbos</p>
                        <p className='text-base font-medium text-foreground'>{summary.carbsG}g</p>
                     </div>
                     <div>
                        <p className='text-xs text-muted-foreground'>Grasas</p>
                        <p className='text-base font-medium text-foreground'>{summary.fatsG}g</p>
                     </div>
                  </div>
                  <Separator />
                  <div className='flex items-center gap-3'>
                     <Droplets className='h-5 w-5 text-primary' aria-hidden='true' />
                     <div className='flex-1'>
                        <p className='text-xs text-muted-foreground'>Hidratación mínima</p>
                        <p className='text-sm font-medium text-foreground'>
                           {(summary.hydrationMl / 1000).toFixed(1)} L de agua al día
                        </p>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle className='text-base'>Lo que viene</CardTitle>
               </CardHeader>
               <CardContent className='space-y-3 text-sm text-muted-foreground'>
                  <p className='flex items-start gap-2'>
                     <Sparkles
                        className='mt-0.5 h-4 w-4 shrink-0 text-secondary'
                        aria-hidden='true'
                     />
                     Plan de comidas hecho a tu medida (Fase 5).
                  </p>
                  <p className='flex items-start gap-2'>
                     <Sparkles
                        className='mt-0.5 h-4 w-4 shrink-0 text-secondary'
                        aria-hidden='true'
                     />
                     Rutinas que se ajustan a tu tiempo (Fase 6).
                  </p>
                  <p className='flex items-start gap-2'>
                     <Sparkles
                        className='mt-0.5 h-4 w-4 shrink-0 text-secondary'
                        aria-hidden='true'
                     />
                     Cuando hoy no puedas, te damos alternativas amables.
                  </p>
               </CardContent>
            </Card>

            {hasMedical ? (
               <Card className='border-secondary/40 bg-secondary/5'>
                  <CardContent className='pt-6 text-sm text-foreground'>
                     Como nos comentaste de tu salud, te sugerimos comentar este plan con tu
                     profesional de confianza antes de empezar 🌿.
                  </CardContent>
               </Card>
            ) : null}

            <div className='mt-8 flex items-center gap-3'>
               <Button
                  type='button'
                  variant='ghost'
                  onClick={handleBack}
                  disabled={submitting}
                  className='flex-1'
               >
                  <ArrowLeft className='h-4 w-4' />
                  Atrás
               </Button>
               <Button
                  type='button'
                  onClick={onConfirm}
                  disabled={blocked || submitting}
                  className='flex-1'
               >
                  {submitting ? (
                     <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                     'Empezar mi PulseFit 🌱'
                  )}
               </Button>
            </div>
         </div>
      </OnboardingLayout>
   )
}

export default Step7Review
