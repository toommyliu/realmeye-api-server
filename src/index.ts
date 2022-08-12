import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isBoom, Boom, notFound } from '@hapi/boom';
import helmet from 'helmet';
import polka, { type Middleware } from 'polka';
import readdirp from 'readdirp';

import type { Route } from './Route.js';
import { logger } from './logger.js';
import { logRequests } from './middleware/logRequests.js';
import { sendBoom } from './util/sendBoom.js';

void (async () => {
	const app = polka({
		onError(e, _, res) {
			res.setHeader('content-type', 'application/json');
			const boom = isBoom(e) ? e : new Boom(e);

			if (boom.output.statusCode === 500) {
				logger.error(boom, boom.message);
			}

			sendBoom(boom, res);
		},
		onNoMatch(_, res) {
			res.setHeader('content-type', 'application/json');
			sendBoom(notFound(), res);
		},
	});

	app.use('/api/v1', app);
	app.use(logRequests(), helmet() as Middleware);

	const files = readdirp(join(fileURLToPath(new URL('./routes', import.meta.url).href)), {
		fileFilter: ['*.js'],
	});

	for await (const routeFile of files) {
		const route = (await import(routeFile.fullPath)) as Route;
		app.get(route.path, async (req, res, next) => {
			try {
				await route.handle(req, res);
			} catch (e) {
				const err = e as Error;
				void next(err);
			}
		});
	}

	app.listen(3000, () => logger.info(`Api up on port 3000`));
})();
