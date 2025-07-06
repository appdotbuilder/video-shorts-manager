
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoConversionRequestsTable } from '../db/schema';
import { type UpdateVideoConversionRequestStatusInput } from '../schema';
import { updateVideoConversionRequestStatus } from '../handlers/update_video_conversion_request_status';
import { eq } from 'drizzle-orm';

describe('updateVideoConversionRequestStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update video conversion request status', async () => {
    // First create a video conversion request directly in the database
    const createResult = await db.insert(videoConversionRequestsTable)
      .values({
        original_url: 'https://example.com/video.mp4',
        title: 'Test Video',
        description: 'Test description',
        status: 'pending'
      })
      .returning()
      .execute();

    const createdRequest = createResult[0];

    // Update the status
    const updateInput: UpdateVideoConversionRequestStatusInput = {
      id: createdRequest.id,
      status: 'processing'
    };

    const result = await updateVideoConversionRequestStatus(updateInput);

    expect(result.id).toEqual(createdRequest.id);
    expect(result.status).toEqual('processing');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdRequest.updated_at.getTime());
    expect(result.completed_at).toBeNull();
  });

  it('should update status to completed and set completed_at timestamp', async () => {
    // Create a video conversion request directly in the database
    const createResult = await db.insert(videoConversionRequestsTable)
      .values({
        original_url: 'https://example.com/video.mp4',
        title: 'Test Video',
        status: 'pending'
      })
      .returning()
      .execute();

    const createdRequest = createResult[0];

    // Update to completed status
    const updateInput: UpdateVideoConversionRequestStatusInput = {
      id: createdRequest.id,
      status: 'completed',
      short_video_url: 'https://example.com/short.mp4',
      download_url: 'https://example.com/download.mp4'
    };

    const result = await updateVideoConversionRequestStatus(updateInput);

    expect(result.status).toEqual('completed');
    expect(result.short_video_url).toEqual('https://example.com/short.mp4');
    expect(result.download_url).toEqual('https://example.com/download.mp4');
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.completed_at).not.toBeNull();
  });

  it('should update status to failed with error message', async () => {
    // Create a video conversion request directly in the database
    const createResult = await db.insert(videoConversionRequestsTable)
      .values({
        original_url: 'https://example.com/video.mp4',
        status: 'pending'
      })
      .returning()
      .execute();

    const createdRequest = createResult[0];

    // Update to failed status with error message
    const updateInput: UpdateVideoConversionRequestStatusInput = {
      id: createdRequest.id,
      status: 'failed',
      error_message: 'Video processing failed due to invalid format'
    };

    const result = await updateVideoConversionRequestStatus(updateInput);

    expect(result.status).toEqual('failed');
    expect(result.error_message).toEqual('Video processing failed due to invalid format');
    expect(result.completed_at).toBeNull();
  });

  it('should save updated data to database', async () => {
    // Create a video conversion request directly in the database
    const createResult = await db.insert(videoConversionRequestsTable)
      .values({
        original_url: 'https://example.com/video.mp4',
        title: 'Test Video',
        status: 'pending'
      })
      .returning()
      .execute();

    const createdRequest = createResult[0];

    // Update the request
    const updateInput: UpdateVideoConversionRequestStatusInput = {
      id: createdRequest.id,
      status: 'completed',
      short_video_url: 'https://example.com/short.mp4',
      download_url: 'https://example.com/download.mp4'
    };

    await updateVideoConversionRequestStatus(updateInput);

    // Verify the update was saved to database
    const saved = await db.select()
      .from(videoConversionRequestsTable)
      .where(eq(videoConversionRequestsTable.id, createdRequest.id))
      .execute();

    expect(saved).toHaveLength(1);
    expect(saved[0].status).toEqual('completed');
    expect(saved[0].short_video_url).toEqual('https://example.com/short.mp4');
    expect(saved[0].download_url).toEqual('https://example.com/download.mp4');
    expect(saved[0].completed_at).toBeInstanceOf(Date);
    expect(saved[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when video conversion request not found', async () => {
    const updateInput: UpdateVideoConversionRequestStatusInput = {
      id: 999,
      status: 'completed'
    };

    await expect(updateVideoConversionRequestStatus(updateInput))
      .rejects.toThrow(/not found/i);
  });

  it('should update only provided optional fields', async () => {
    // Create a video conversion request directly in the database
    const createResult = await db.insert(videoConversionRequestsTable)
      .values({
        original_url: 'https://example.com/video.mp4',
        title: 'Test Video',
        status: 'pending'
      })
      .returning()
      .execute();

    const createdRequest = createResult[0];

    // Update only status and short_video_url
    const updateInput: UpdateVideoConversionRequestStatusInput = {
      id: createdRequest.id,
      status: 'processing',
      short_video_url: 'https://example.com/short.mp4'
    };

    const result = await updateVideoConversionRequestStatus(updateInput);

    expect(result.status).toEqual('processing');
    expect(result.short_video_url).toEqual('https://example.com/short.mp4');
    expect(result.download_url).toBeNull();
    expect(result.error_message).toBeNull();
  });
});
