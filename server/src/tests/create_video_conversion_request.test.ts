
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoConversionRequestsTable } from '../db/schema';
import { type CreateVideoConversionRequestInput } from '../schema';
import { createVideoConversionRequest } from '../handlers/create_video_conversion_request';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateVideoConversionRequestInput = {
  original_url: 'https://example.com/video.mp4',
  title: 'Test Video',
  description: 'A test video for conversion'
};

// Test input with minimal fields
const minimalInput: CreateVideoConversionRequestInput = {
  original_url: 'https://example.com/minimal.mp4'
};

describe('createVideoConversionRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a video conversion request with all fields', async () => {
    const result = await createVideoConversionRequest(testInput);

    // Basic field validation
    expect(result.original_url).toEqual('https://example.com/video.mp4');
    expect(result.title).toEqual('Test Video');
    expect(result.description).toEqual('A test video for conversion');
    expect(result.status).toEqual('pending');
    expect(result.error_message).toBeNull();
    expect(result.short_video_url).toBeNull();
    expect(result.download_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull();
  });

  it('should create a video conversion request with minimal fields', async () => {
    const result = await createVideoConversionRequest(minimalInput);

    expect(result.original_url).toEqual('https://example.com/minimal.mp4');
    expect(result.title).toBeNull();
    expect(result.description).toBeNull();
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save video conversion request to database', async () => {
    const result = await createVideoConversionRequest(testInput);

    // Query using proper drizzle syntax
    const requests = await db.select()
      .from(videoConversionRequestsTable)
      .where(eq(videoConversionRequestsTable.id, result.id))
      .execute();

    expect(requests).toHaveLength(1);
    expect(requests[0].original_url).toEqual('https://example.com/video.mp4');
    expect(requests[0].title).toEqual('Test Video');
    expect(requests[0].description).toEqual('A test video for conversion');
    expect(requests[0].status).toEqual('pending');
    expect(requests[0].created_at).toBeInstanceOf(Date);
    expect(requests[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set default status to pending', async () => {
    const result = await createVideoConversionRequest(testInput);

    expect(result.status).toEqual('pending');

    // Verify in database
    const requests = await db.select()
      .from(videoConversionRequestsTable)
      .where(eq(videoConversionRequestsTable.id, result.id))
      .execute();

    expect(requests[0].status).toEqual('pending');
  });

  it('should handle multiple requests with different URLs', async () => {
    const input1 = { original_url: 'https://example.com/video1.mp4', title: 'Video 1' };
    const input2 = { original_url: 'https://example.com/video2.mp4', title: 'Video 2' };

    const result1 = await createVideoConversionRequest(input1);
    const result2 = await createVideoConversionRequest(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.original_url).toEqual('https://example.com/video1.mp4');
    expect(result2.original_url).toEqual('https://example.com/video2.mp4');
    expect(result1.title).toEqual('Video 1');
    expect(result2.title).toEqual('Video 2');
  });
});
