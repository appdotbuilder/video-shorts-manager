
import { db } from '../db';
import { videoConversionRequestsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetVideoConversionRequestByIdInput, type VideoConversionRequest } from '../schema';

export const getVideoConversionRequestById = async (input: GetVideoConversionRequestByIdInput): Promise<VideoConversionRequest | null> => {
  try {
    const results = await db.select()
      .from(videoConversionRequestsTable)
      .where(eq(videoConversionRequestsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Failed to get video conversion request by ID:', error);
    throw error;
  }
};
