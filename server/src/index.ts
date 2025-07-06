
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createVideoConversionRequestInputSchema,
  updateVideoConversionRequestStatusInputSchema,
  getVideoConversionRequestsInputSchema,
  getVideoConversionRequestByIdInputSchema
} from './schema';

// Import handlers
import { createVideoConversionRequest } from './handlers/create_video_conversion_request';
import { getVideoConversionRequests } from './handlers/get_video_conversion_requests';
import { getVideoConversionRequestById } from './handlers/get_video_conversion_request_by_id';
import { updateVideoConversionRequestStatus } from './handlers/update_video_conversion_request_status';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new video conversion request
  createVideoConversionRequest: publicProcedure
    .input(createVideoConversionRequestInputSchema)
    .mutation(({ input }) => createVideoConversionRequest(input)),
  
  // Get all video conversion requests with optional filtering
  getVideoConversionRequests: publicProcedure
    .input(getVideoConversionRequestsInputSchema.optional())
    .query(({ input }) => getVideoConversionRequests(input)),
  
  // Get a specific video conversion request by ID
  getVideoConversionRequestById: publicProcedure
    .input(getVideoConversionRequestByIdInputSchema)
    .query(({ input }) => getVideoConversionRequestById(input)),
  
  // Update the status of a video conversion request
  updateVideoConversionRequestStatus: publicProcedure
    .input(updateVideoConversionRequestStatusInputSchema)
    .mutation(({ input }) => updateVideoConversionRequestStatus(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
