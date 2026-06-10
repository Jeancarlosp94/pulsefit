import { useQuery } from '@tanstack/react-query'
import {
   fntGetAdherenceSummary,
   fntGetStrengthProgress,
   fntGetWeightHistory,
   fntGetWellbeingHistory
} from '@/api/fntProgress'
import { useAuth } from './useAuth'
import type {
   ItfAdherenceSummary,
   ItfStrengthProgressPoint,
   ItfWeightPoint,
   ItfWellbeingPoint
} from '@/interface/itfProgress'

const STALE = 2 * 60 * 1000 /* 2 min */

export const useWeightHistory = (days = 90) => {
   const { user, onboardingCompleted } = useAuth()
   return useQuery<ItfWeightPoint[]>({
      queryKey: ['progress', 'weight', days],
      queryFn: () => fntGetWeightHistory(days),
      enabled: !!user && onboardingCompleted,
      staleTime: STALE
   })
}

export const useWellbeingHistory = (days = 30) => {
   const { user, onboardingCompleted } = useAuth()
   return useQuery<ItfWellbeingPoint[]>({
      queryKey: ['progress', 'wellbeing', days],
      queryFn: () => fntGetWellbeingHistory(days),
      enabled: !!user && onboardingCompleted,
      staleTime: STALE
   })
}

export const useAdherenceSummary = () => {
   const { user, onboardingCompleted } = useAuth()
   return useQuery<ItfAdherenceSummary>({
      queryKey: ['progress', 'adherence'],
      queryFn: fntGetAdherenceSummary,
      enabled: !!user && onboardingCompleted,
      staleTime: STALE
   })
}

export const useStrengthProgress = () => {
   const { user, onboardingCompleted } = useAuth()
   return useQuery<ItfStrengthProgressPoint[]>({
      queryKey: ['progress', 'strength'],
      queryFn: fntGetStrengthProgress,
      enabled: !!user && onboardingCompleted,
      staleTime: STALE
   })
}
