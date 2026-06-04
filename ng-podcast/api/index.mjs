/**
 * Vercel serverless entry — routes all requests through Angular SSR (reqHandler).
 * Requires `npm run build:prod` so dist/ng-podcast/server/server.mjs exists.
 */
const { reqHandler } = await import('../dist/ng-podcast/server/server.mjs');

export default reqHandler;
