import Hapi from '@hapi/hapi';
import { logger } from './util/logger.js';

// #region player routes
import getPlayerByName from './routes/players/player.js';
// #endregion

const app = Hapi.server({
	port: 3000,
	host: 'localhost',
});

await app.start();

app.route({
	method: 'GET',
	path: '/api/player/{name}',
	handler: getPlayerByName,
});

export default app;
