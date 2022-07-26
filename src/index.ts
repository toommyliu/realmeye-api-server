import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isBoom, Boom, notFound } from '@hapi/boom';
import helmet from 'helmet';
import { parse } from 'node-html-parser';
import polka, { type Middleware } from 'polka';
import readdirp from 'readdirp';
import type { Route } from './Route.js';
import { get } from './constants.js';
import { logger } from './logger.js';
import { logRequests } from './middleware/logRequests.js';
import { sendBoom } from './util/sendBoom.js';

const port = parseInt(process.env.PORT!, 10) || 3000;

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
			const _req = await get(req.path);
			const document = parse(_req.data as string);

			try {
				const json = await route.handle(document);
				await res.end(json);
			} catch (e) {
				const err = e as Error;
				void next(err);
			}
		});
	}

	app.listen(port, () => logger.info(`Api up on port ${port}`));
})();
