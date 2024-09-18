import fastify from 'fastify';
import { logger } from './util/logger.js';

// #region player routes
import getPlayerByName from './routes/players/player.js';
// #endregion

const app = fastify({ logger });

app.get('/api/player/:name', getPlayerByName);

await app.listen({ port: 3000 });

export default app;
