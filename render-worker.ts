/**
 * Render Worker — Uses @hyperframes/producer's built-in server.
 * 
 * This replaces the custom Puppeteer + FFmpeg pipeline with HyperFrames'
 * production-grade BeginFrame-based rendering engine.
 * 
 * Endpoints provided by the producer server:
 *   POST /render         — blocking render, returns JSON
 *   POST /render/stream  — SSE streaming render with progress  
 *   GET  /render/queue   — current render queue status
 *   GET  /health         — health check
 *   GET  /outputs/:token — download rendered MP4
 */
import { startServer } from '@hyperframes/producer/server';

const port = parseInt(process.env.PORT || '3000');

console.log(`[Render Worker] Starting @hyperframes/producer server on port ${port}...`);

const server = startServer({
  port,
  maxConcurrentRenders: 1, // Railway memory constraint
  rendersDir: process.env.RENDERS_DIR || '/tmp/renders',
});

console.log(`[Render Worker] Producer server running on port ${port}`);
console.log(`[Render Worker] Endpoints:`);
console.log(`  POST /render         — render a composition`);
console.log(`  POST /render/stream  — SSE streaming render`);
console.log(`  GET  /render/queue   — queue status`);
console.log(`  GET  /health         — health check`);
console.log(`  GET  /outputs/:token — download output`);
