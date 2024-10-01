import Hapi from '@hapi/hapi';
import { logger } from './util/logger.js';
import fs from 'node:fs/promises';

const app = Hapi.server({
	port: 3000,
	host: 'localhost',
});

async function startServer() {
	await app.start();
	logger.info(`API listening on ${app.info.uri}`);

	for await (const route of await fs.readdir('./src/routes/player', { withFileTypes: true })) {
		if (route.isFile()) {
			const routeName = route.name.replace('.ts', '');

			const mod = await import(`./routes/player/${routeName}.js`);
			if (mod && mod?.default && typeof mod.default === 'object') {
				app.route(mod.default);
			}
		}
	}
}

await startServer().catch((err) => {
	const error = err as Error;
	logger.error(error, 'Failed to start server');
	process.exit(1);
});

export default app;
