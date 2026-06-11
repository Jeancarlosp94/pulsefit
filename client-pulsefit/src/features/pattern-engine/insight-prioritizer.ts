import type { ItfRecommendation } from './types'

const SEVERITY_RANK: Record<ItfRecommendation['severity'], number> = {
   high: 0,
   medium: 1,
   low: 2
}

/**
 * Ordena por severity y limita a un máximo para no abrumar al usuario.
 * Default: 5 insights.
 */
export const prioritizeInsights = (recs: ItfRecommendation[], limit = 5): ItfRecommendation[] => {
   return [...recs]
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
      .slice(0, limit)
}
