
import { db } from '../db';
import { videoConversionRequestsTable } from '../db/schema';
import { type UpdateVideoConversionRequestStatusInput, type VideoConversionRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const updateVideoConversionRequestStatus = async (input: UpdateVideoConversionRequestStatusInput): Promise<VideoConversionRequest> => {
  try {
    // Prepare update values
    const updateValues: any = {
      status: input.status,
      updated_at: new Date()
    };

    // Add optional fields if provided
    if (input.error_message !== undefined) {
      updateValues.error_message = input.error_message;
    }

    if (input.short_video_url !== undefined) {
      updateValues.short_video_url = input.short_video_url;
    }

    if (input.download_url !== undefined) {
      updateValues.download_url = input.download_url;
    }

    // Handle progress percentage logic
    if (input.status === 'completed') {
      updateValues.completed_at = new Date();
      updateValues.progress_percentage = 100; // Force to 100 if completed
    } else if (input.progress_percentage !== undefined) {
      updateValues.progress_percentage = input.progress_percentage;
    } else if (input.status === 'failed') {
      updateValues.progress_percentage = 0; // Reset to 0 if failed
    }

    // Update the video conversion request
    const result = await db.update(videoConversionRequestsTable)
      .set(updateValues)
      .where(eq(videoConversionRequestsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Video conversion request with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Video conversion request status update failed:', error);
    throw error;
  }
};
