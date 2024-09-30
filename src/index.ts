import Hapi from '@hapi/hapi';
import { logger } from './util/logger.js';

// #region player routes
import getPlayerByName from './routes/player/player.js';
import getPetsOf from './routes/player/pets-of.js';
import getRankHistoryOf from './routes/player/rank-history-of-player.js';
// #endregion

const app = Hapi.server({
	port: 3000,
	host: 'localhost',
});

await app.start();
logger.info(`API listening on ${app.info.uri}`);
app.route({
	method: 'GET',
	path: '/api/player/{name}',
	handler: getPlayerByName,
});

app.route({
	method: 'GET',
	path: '/api/player/{name}/pets-of',
	handler: getPetsOf,
});

app.route({
	method: 'GET',
	path: '/api/player/{name}/rank-history-of',
	handler: getRankHistoryOf,
});

export default app;
