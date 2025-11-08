import { z } from 'zod';

// Data contracts (typed DTOs + Zod)
export const KpiSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number(),
  delta: z.number().optional(),
  hint: z.string().optional(),
  ci: z.object({
    lo: z.number(),
    hi: z.number(),
  }).optional(),
  n: z.number().optional(),
  spark: z.array(z.number()).optional(),
});

export const CategoryPerfSchema = z.object({
  id: z.string(),
  name: z.string(),
  quizzes: z.number(),
  exposures: z.number(),
  weightedSr: z.number(),
  trend: z.number(),
  freshnessDays: z.number(),
});

export const HeatCellSchema = z.object({
  categoryId: z.string(),
  category: z.string(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  sr: z.number(),
  n: z.number(),
  qCount: z.number(),
});

export const RiskRowSchema = z.object({
  id: z.string(),
  snippet: z.string(),
  category: z.string(),
  sr: z.number(),
  ci: z.object({
    lo: z.number(),
    hi: z.number(),
  }).optional(),
  n: z.number(),
  reason: z.union([
    z.literal('low_sr'),
    z.literal('wide_ci'),
    z.literal('variance'),
  ]),
});

export const EventItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  tags: z.array(z.string()),
  action: z.union([
    z.literal('insert_blurb'),
    z.literal('suggest_category'),
    z.literal('seed_q'),
  ]),
});

// TypeScript types
export type Kpi = z.infer<typeof KpiSchema>;
export type CategoryPerf = z.infer<typeof CategoryPerfSchema>;
export type HeatCell = z.infer<typeof HeatCellSchema>;
export type RiskRow = z.infer<typeof RiskRowSchema>;
export type EventItem = z.infer<typeof EventItemSchema>;

// Additional types for the admin system
export type SidebarItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  section: 'make' | 'manage' | 'improve' | 'system';
};

export type QuizRound = {
  id: string;
  category: string;
  questions: Question[];
  blurb?: string;
};

export type Question = {
  id: string;
  question: string;
  answer: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  status: 'draft' | 'review' | 'published' | 'archived';
  category: string;
  tags: string[];
  analytics?: {
    successRate: number;
    attempts: number;
    lastUsed?: string;
  };
};

export type Quiz = {
  id: string;
  number: number;
  title: string;
  description: string;
  rounds: QuizRound[];
  status: 'draft' | 'scheduled' | 'published';
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
};