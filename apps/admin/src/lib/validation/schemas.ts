/**
 * Shared Zod Schemas for API Validation
 * 
 * Common schemas used across multiple API routes.
 * Import and extend these for route-specific validation.
 */

import { z } from 'zod';

// ============================================================================
// Common Field Schemas
// ============================================================================

export const IdSchema = z.string().min(1, 'ID is required');
export const OptionalIdSchema = z.string().min(1).optional();

export const EmailSchema = z.string().email('Invalid email address');
export const PasswordSchema = z.string().min(8, 'Password must be at least 8 characters');

export const ColorHexSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color hex format');

export const SlugSchema = z.string().min(1).regex(/^[a-z0-9-]+$/, 'Invalid slug format');

// ============================================================================
// Pagination Schemas
// ============================================================================

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

export const SearchQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});

// Admin users query
export const AdminUsersQuerySchema = SearchQuerySchema.extend({
  tier: z.string().optional(),
});

// Admin organisations query
export const AdminOrganisationsQuerySchema = SearchQuerySchema.extend({
  status: z.string().optional(),
});

// Admin quizzes query
export const AdminQuizzesQuerySchema = SearchQuerySchema.extend({
  status: z.string().optional(),
  sortBy: z.enum(['publicationDate', 'title', 'status', 'createdAt']).default('createdAt').optional(),
});

// ============================================================================
// Quiz Schemas
// ============================================================================

export const QuestionInputSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  question: z.string().min(1, 'Question text is required'),
  answer: z.string().min(1, 'Answer is required'),
  explanation: z.string().optional(),
  category: z.string().optional(),
});

export const RoundInputSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Round title is required'),
  blurb: z.string().optional(),
  questions: z.array(QuestionInputSchema).min(1, 'Round must have at least one question'),
  kind: z.enum(['standard', 'finale']).optional(),
});

export const CreateQuizSchema = z.object({
  number: z.number().int().positive('Quiz number must be positive'),
  title: z.string().min(1, 'Quiz title is required').max(200),
  description: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published']),
  scheduledDate: z.string().optional(), // Accept ISO date string or any string, will be validated when parsed
  rounds: z.array(RoundInputSchema).min(1, 'Quiz must have at least one round'),
});

export const UpdateQuizSchema = CreateQuizSchema.partial().extend({
  id: IdSchema,
});

// Partial quiz update (PATCH) - only metadata
export const PatchQuizSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  blurb: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published']).optional(),
  colorHex: ColorHexSchema.optional(),
  weekISO: z.string().optional(),
  publicationDate: z.string().datetime().optional().nullable(),
});

// Full quiz update (PUT) - includes rounds
export const PutQuizSchema = CreateQuizSchema.partial();

// ============================================================================
// User Schemas
// ============================================================================

export const CreateUserSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1, 'Name is required').max(100),
  password: PasswordSchema.optional(),
  role: z.enum(['student', 'teacher', 'admin']).optional(),
  schoolId: IdSchema.optional(),
});

export const UpdateUserSchema = z.object({
  id: IdSchema,
  email: EmailSchema.optional(),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['student', 'teacher', 'admin']).optional(),
});

export const UpdateUserRoleSchema = z.object({
  platformRole: z.enum(['Student', 'Teacher', 'OrgAdmin', 'PlatformAdmin']),
});

// Admin user creation (simpler than signup)
export const AdminCreateUserSchema = z.object({
  email: EmailSchema,
  name: z.string().max(100).optional(),
  tier: z.enum(['basic', 'premium']).default('basic').optional(),
  platformRole: z.enum(['Student', 'Teacher', 'OrgAdmin', 'PlatformAdmin']).nullable().optional(),
  subscriptionStatus: z.string().optional(),
});

// Admin user update (PATCH)
export const AdminUpdateUserSchema = z.object({
  name: z.string().max(100).optional(),
  tier: z.enum(['basic', 'premium']).optional(),
  platformRole: z.enum(['Student', 'Teacher', 'OrgAdmin', 'PlatformAdmin']).nullable().optional(),
  subscriptionStatus: z.string().optional(),
  subscriptionPlan: z.string().optional(),
  subscriptionEndsAt: z.string().datetime().optional().nullable(),
});

// ============================================================================
// Organisation Schemas
// ============================================================================

export const CreateOrganisationSchema = z.object({
  name: z.string().min(1, 'Organisation name is required').max(200),
  region: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
});

export const UpdateOrganisationSchema = CreateOrganisationSchema.partial().extend({
  id: IdSchema,
});

// Admin organisation creation
export const AdminCreateOrganisationSchema = z.object({
  name: z.string().min(1, 'Organisation name is required').max(200),
  emailDomain: z.string().optional().nullable(),
  ownerUserId: IdSchema,
  maxSeats: z.number().int().min(0).default(0).optional(),
  plan: z.enum(['INDIVIDUAL', 'TEAM', 'ENTERPRISE']).default('INDIVIDUAL').optional(),
  status: z.string().default('TRIALING').optional(),
});

// Admin organisation update (PATCH)
export const AdminUpdateOrganisationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  emailDomain: z.string().optional().nullable(),
  status: z.string().optional(),
  plan: z.enum(['INDIVIDUAL', 'TEAM', 'ENTERPRISE']).optional(),
  maxSeats: z.number().int().min(0).optional(),
  currentPeriodStart: z.string().datetime().optional().nullable(),
  currentPeriodEnd: z.string().datetime().optional().nullable(),
  gracePeriodEnd: z.string().datetime().optional().nullable(),
});

// ============================================================================
// Achievement Schemas
// ============================================================================

export const CreateAchievementSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  name: z.string().min(1, 'Name is required'),
  shortDescription: z.string().min(1, 'Short description is required'),
  longDescription: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  rarity: z.string().min(1, 'Rarity is required'),
  isPremiumOnly: z.boolean().default(false).optional(),
  seasonTag: z.string().optional(),
  iconKey: z.string().optional(),
  unlockConditionType: z.string().min(1, 'Unlock condition type is required'),
  unlockConditionConfig: z.record(z.any()).default({}).optional(),
  appearance: z.record(z.any()).default({}).optional(),
  isActive: z.boolean().default(true).optional(),
  points: z.number().int().optional(),
  series: z.string().optional(),
  cardVariant: z.string().optional(),
});

export const UpdateAchievementSchema = CreateAchievementSchema.partial().extend({
  id: IdSchema,
});

// Achievement query schema
export const AchievementQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100).optional(),
});

// ============================================================================
// Custom Quiz Schemas
// ============================================================================

export const CustomQuizRoundSchema = z.object({
  title: z.string().max(100).optional(),
  blurb: z.string().max(300).optional(),
  questions: z.array(
    z.object({
      text: z.string().min(10).max(500),
      answer: z.string().min(1).max(200),
      explanation: z.string().max(500).optional(),
    })
  ).min(1).max(20),
});

export const CreateCustomQuizSchema = z.object({
  title: z.string().min(3).max(100),
  blurb: z.string().max(500).optional(),
  colorHex: ColorHexSchema,
  rounds: z.array(CustomQuizRoundSchema).min(1).max(10),
}).refine(
  (data) => {
    const totalQuestions = data.rounds.reduce((sum, round) => sum + round.questions.length, 0);
    return totalQuestions >= 1 && totalQuestions <= 100;
  },
  { message: 'Total questions must be between 1 and 100' }
);

// ============================================================================
// Private League Schemas
// ============================================================================

export const CreatePrivateLeagueSchema = z.object({
  name: z.string().min(1, 'League name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  organisationId: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export const JoinLeagueSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required').toUpperCase(),
});

// ============================================================================
// Leaderboard Schemas
// ============================================================================

export const JoinLeaderboardByCodeSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

export const LeaveLeaderboardSchema = z.object({
  mute: z.boolean().optional().default(false),
});

// ============================================================================
// Question Management Schemas
// ============================================================================

export const CreateQuestionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  answer: z.string().min(1, 'Answer is required'),
  explanation: z.string().optional(),
  categoryId: z.string().min(1, 'Category ID is required'),
  createdBy: z.string().optional(),
});

// ============================================================================
// Round Management Schemas
// ============================================================================

export const CreateRoundSchema = z.object({
  title: z.string().min(1, 'Round title is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  blurb: z.string().optional(),
  questions: z.array(
    z.object({
      text: z.string().min(1, 'Question text is required'),
      answer: z.string().min(1, 'Answer is required'),
      explanation: z.string().optional(),
    })
  ).min(1, 'Round must have at least one question'),
});

// ============================================================================
// Auth Schemas
// ============================================================================

export const SignupSchema = z.object({
  method: z.enum(['email', 'phone', 'code']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  signupCode: z.string().optional(),
  password: z.string().optional(),
  referralCode: z.string().optional(),
}).refine(
  (data) => {
    if (data.method === 'email') return !!data.email;
    if (data.method === 'phone') return !!data.phone;
    if (data.method === 'code') return !!data.signupCode;
    return false;
  },
  { message: 'Required field missing for selected signup method' }
);

export const SigninSchema = z.object({
  method: z.enum(['email', 'phone', 'code']).optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  signupCode: z.string().optional(),
  password: z.string().optional(),
});

// ============================================================================
// Contact/Support Schemas
// ============================================================================

export const ContactSupportSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export const ContactSuggestionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: EmailSchema,
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

// ============================================================================
// Profile Schemas
// ============================================================================

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  teamName: z.string().max(50).optional(),
  profileVisibility: z.enum(['PUBLIC', 'LEAGUES_ONLY', 'PRIVATE']).optional(),
  avatar: z.string().optional(), // Single emoji or empty string - will be validated in route
}).refine(
  (data) => {
    // Validate avatar is either empty or a single emoji
    if (data.avatar && data.avatar !== '') {
      return /^[\p{Emoji}]$/u.test(data.avatar);
    }
    return true;
  },
  {
    message: 'Avatar must be a single emoji',
    path: ['avatar'],
  }
);

// ============================================================================
// Type Exports
// ============================================================================

export type CreateQuizInput = z.infer<typeof CreateQuizSchema>;
export type UpdateQuizInput = z.infer<typeof UpdateQuizSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateOrganisationInput = z.infer<typeof CreateOrganisationSchema>;
export type CreateAchievementInput = z.infer<typeof CreateAchievementSchema>;
export type CreateCustomQuizInput = z.infer<typeof CreateCustomQuizSchema>;

