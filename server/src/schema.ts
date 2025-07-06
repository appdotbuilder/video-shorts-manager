
import { z } from 'zod';

// Video conversion request statuses
export const conversionStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed']);
export type ConversionStatus = z.infer<typeof conversionStatusEnum>;

// Video conversion request schema
export const videoConversionRequestSchema = z.object({
  id: z.number(),
  original_url: z.string().url(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  status: conversionStatusEnum,
  progress_percentage: z.number().int().min(0).max(100),
  error_message: z.string().nullable(),
  short_video_url: z.string().url().nullable(),
  download_url: z.string().url().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable()
});

export type VideoConversionRequest = z.infer<typeof videoConversionRequestSchema>;

// Input schema for creating video conversion requests
export const createVideoConversionRequestInputSchema = z.object({
  original_url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional()
});

export type CreateVideoConversionRequestInput = z.infer<typeof createVideoConversionRequestInputSchema>;

// Input schema for updating video conversion request status
export const updateVideoConversionRequestStatusInputSchema = z.object({
  id: z.number(),
  status: conversionStatusEnum,
  error_message: z.string().optional(),
  short_video_url: z.string().url().optional(),
  download_url: z.string().url().optional(),
  progress_percentage: z.number().int().min(0).max(100).optional()
});

export type UpdateVideoConversionRequestStatusInput = z.infer<typeof updateVideoConversionRequestStatusInputSchema>;

// Query schema for filtering requests
export const getVideoConversionRequestsInputSchema = z.object({
  status: conversionStatusEnum.optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetVideoConversionRequestsInput = z.infer<typeof getVideoConversionRequestsInputSchema>;

// Schema for single request by ID
export const getVideoConversionRequestByIdInputSchema = z.object({
  id: z.number()
});

export type GetVideoConversionRequestByIdInput = z.infer<typeof getVideoConversionRequestByIdInputSchema>;
