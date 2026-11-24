import { z } from 'zod';

/**
 * Validation schema for general dashboard query parameters
 */
export const dashboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

/**
 * Validation schema for recent activity feeds (appointments, reports, prescriptions)
 */
export const recentActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

/**
 * Validation schema for statistics query (e.g., custom reference date)
 */
export const statsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});
