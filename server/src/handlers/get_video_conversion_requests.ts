
import { db } from '../db';
import { videoConversionRequestsTable } from '../db/schema';
import { type GetVideoConversionRequestsInput, type VideoConversionRequest } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getVideoConversionRequests = async (input?: GetVideoConversionRequestsInput): Promise<VideoConversionRequest[]> => {
  try {
    // Set defaults
    const limit = input?.limit ?? 20;
    const offset = input?.offset ?? 0;

    // Build query with status filter if provided
    const results = input?.status
      ? await db.select()
          .from(videoConversionRequestsTable)
          .where(eq(videoConversionRequestsTable.status, input.status))
          .orderBy(desc(videoConversionRequestsTable.created_at))
          .limit(limit)
          .offset(offset)
          .execute()
      : await db.select()
          .from(videoConversionRequestsTable)
          .orderBy(desc(videoConversionRequestsTable.created_at))
          .limit(limit)
          .offset(offset)
          .execute();

    return results;
  } catch (error) {
    console.error('Failed to get video conversion requests:', error);
    throw error;
  }
};
