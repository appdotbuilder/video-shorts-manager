
import { db } from '../db';
import { videoConversionRequestsTable } from '../db/schema';
import { type CreateVideoConversionRequestInput, type VideoConversionRequest } from '../schema';

export const createVideoConversionRequest = async (input: CreateVideoConversionRequestInput): Promise<VideoConversionRequest> => {
  try {
    // Insert video conversion request record
    const result = await db.insert(videoConversionRequestsTable)
      .values({
        original_url: input.original_url,
        title: input.title || null,
        description: input.description || null,
        status: 'pending' // Default status for new requests
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Video conversion request creation failed:', error);
    throw error;
  }
};
