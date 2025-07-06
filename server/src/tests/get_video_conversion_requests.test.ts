
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoConversionRequestsTable } from '../db/schema';
import { type GetVideoConversionRequestsInput, type CreateVideoConversionRequestInput } from '../schema';
import { getVideoConversionRequests } from '../handlers/get_video_conversion_requests';

// Helper function to create test video conversion requests
const createTestRequest = async (overrides?: Partial<CreateVideoConversionRequestInput & { status?: 'pending' | 'processing' | 'completed' | 'failed' }>) => {
  const defaultData = {
    original_url: 'https://example.com/video.mp4',
    title: 'Test Video',
    description: 'Test video description',
    status: 'pending' as const,
    ...overrides
  };

  const result = await db.insert(videoConversionRequestsTable)
    .values(defaultData)
    .returning()
    .execute();

  return result[0];
};

describe('getVideoConversionRequests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no requests exist', async () => {
    const result = await getVideoConversionRequests();
    expect(result).toEqual([]);
  });

  it('should return all requests when no filters applied', async () => {
    // Create test requests
    await createTestRequest({ title: 'Video 1' });
    await createTestRequest({ title: 'Video 2' });
    await createTestRequest({ title: 'Video 3' });

    const result = await getVideoConversionRequests();

    expect(result).toHaveLength(3);
    expect(result[0].title).toBeDefined();
    expect(result[0].original_url).toBeDefined();
    expect(result[0].status).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should apply default limit of 20 when not specified', async () => {
    // Create more than 20 requests
    for (let i = 0; i < 25; i++) {
      await createTestRequest({ title: `Video ${i}` });
    }

    const result = await getVideoConversionRequests();

    expect(result).toHaveLength(20);
  });

  it('should filter by status when provided', async () => {
    // Create requests with different statuses
    await createTestRequest({ title: 'Pending Video', status: 'pending' });
    await createTestRequest({ title: 'Processing Video', status: 'processing' });
    await createTestRequest({ title: 'Completed Video', status: 'completed' });
    await createTestRequest({ title: 'Failed Video', status: 'failed' });

    const input: GetVideoConversionRequestsInput = {
      status: 'completed'
    };

    const result = await getVideoConversionRequests(input);

    expect(result).toHaveLength(1);
    expect(result[0].status).toEqual('completed');
    expect(result[0].title).toEqual('Completed Video');
  });

  it('should apply custom limit and offset', async () => {
    // Create test requests
    for (let i = 0; i < 10; i++) {
      await createTestRequest({ title: `Video ${i}` });
    }

    const input: GetVideoConversionRequestsInput = {
      limit: 5,
      offset: 3
    };

    const result = await getVideoConversionRequests(input);

    expect(result).toHaveLength(5);
  });

  it('should order results by created_at in descending order', async () => {
    // Create requests with slight delay to ensure different timestamps
    const first = await createTestRequest({ title: 'First Video' });
    await new Promise(resolve => setTimeout(resolve, 10));
    const second = await createTestRequest({ title: 'Second Video' });
    await new Promise(resolve => setTimeout(resolve, 10));
    const third = await createTestRequest({ title: 'Third Video' });

    const result = await getVideoConversionRequests();

    expect(result).toHaveLength(3);
    // Most recent should be first
    expect(result[0].title).toEqual('Third Video');
    expect(result[1].title).toEqual('Second Video');
    expect(result[2].title).toEqual('First Video');
  });

  it('should handle combination of filters', async () => {
    // Create requests with different statuses
    await createTestRequest({ title: 'Pending 1', status: 'pending' });
    await createTestRequest({ title: 'Pending 2', status: 'pending' });
    await createTestRequest({ title: 'Processing 1', status: 'processing' });
    await createTestRequest({ title: 'Completed 1', status: 'completed' });

    const input: GetVideoConversionRequestsInput = {
      status: 'pending',
      limit: 1,
      offset: 0
    };

    const result = await getVideoConversionRequests(input);

    expect(result).toHaveLength(1);
    expect(result[0].status).toEqual('pending');
  });

  it('should handle zero offset', async () => {
    // Create test requests
    await createTestRequest({ title: 'Video 1' });
    await createTestRequest({ title: 'Video 2' });

    const input: GetVideoConversionRequestsInput = {
      limit: 1,
      offset: 0
    };

    const result = await getVideoConversionRequests(input);

    expect(result).toHaveLength(1);
  });
});
