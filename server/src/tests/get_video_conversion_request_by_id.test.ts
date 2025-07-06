
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoConversionRequestsTable } from '../db/schema';
import { type GetVideoConversionRequestByIdInput, type CreateVideoConversionRequestInput } from '../schema';
import { getVideoConversionRequestById } from '../handlers/get_video_conversion_request_by_id';

// Test input for creating a video conversion request
const testCreateInput: CreateVideoConversionRequestInput = {
  original_url: 'https://example.com/video.mp4',
  title: 'Test Video',
  description: 'A test video for conversion'
};

describe('getVideoConversionRequestById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a video conversion request when found', async () => {
    // Create a test video conversion request
    const createResult = await db.insert(videoConversionRequestsTable)
      .values({
        original_url: testCreateInput.original_url,
        title: testCreateInput.title,
        description: testCreateInput.description,
        status: 'pending'
      })
      .returning()
      .execute();

    const createdRequest = createResult[0];

    // Test the handler
    const input: GetVideoConversionRequestByIdInput = {
      id: createdRequest.id
    };

    const result = await getVideoConversionRequestById(input);

    // Verify the result
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdRequest.id);
    expect(result!.original_url).toEqual('https://example.com/video.mp4');
    expect(result!.title).toEqual('Test Video');
    expect(result!.description).toEqual('A test video for conversion');
    expect(result!.status).toEqual('pending');
    expect(result!.error_message).toBeNull();
    expect(result!.short_video_url).toBeNull();
    expect(result!.download_url).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.completed_at).toBeNull();
  });

  it('should return null when request is not found', async () => {
    const input: GetVideoConversionRequestByIdInput = {
      id: 999
    };

    const result = await getVideoConversionRequestById(input);

    expect(result).toBeNull();
  });

  it('should retrieve request with all possible fields populated', async () => {
    // Create a request with all fields populated
    const createResult = await db.insert(videoConversionRequestsTable)
      .values({
        original_url: 'https://example.com/full-video.mp4',
        title: 'Full Test Video',
        description: 'A complete test video',
        status: 'completed',
        error_message: null,
        short_video_url: 'https://example.com/short.mp4',
        download_url: 'https://example.com/download.mp4',
        completed_at: new Date()
      })
      .returning()
      .execute();

    const createdRequest = createResult[0];

    const input: GetVideoConversionRequestByIdInput = {
      id: createdRequest.id
    };

    const result = await getVideoConversionRequestById(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdRequest.id);
    expect(result!.original_url).toEqual('https://example.com/full-video.mp4');
    expect(result!.title).toEqual('Full Test Video');
    expect(result!.description).toEqual('A complete test video');
    expect(result!.status).toEqual('completed');
    expect(result!.short_video_url).toEqual('https://example.com/short.mp4');
    expect(result!.download_url).toEqual('https://example.com/download.mp4');
    expect(result!.completed_at).toBeInstanceOf(Date);
  });
});
