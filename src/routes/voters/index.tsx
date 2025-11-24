import { VoterDashboard } from '@/pages/voters'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/voters/')({
  component: VoterDashboard,
  validateSearch: z.object({
    section: z.enum([
      'overview',
      'competitions',
      'search-models',
      'settings',
      'support',
      'official-rules'
    ]).optional(),
    payment: z.enum(['cancelled', 'success']).optional(),
  }),
})
