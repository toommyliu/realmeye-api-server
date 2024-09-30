import type Hapi from '@hapi/hapi';
import { parse, valid } from 'node-html-parser';
import { fetch } from '../../util/fetch.js';
import * as Hoek from '@hapi/hoek';

export default {
	method: 'GET',
	path: '/api/player/{name}/name-history-of',
	handler,
} satisfies Hapi.ServerRoute;

async function handler(req: Hapi.Request<Hapi.ReqRefDefaults>, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
	const name = Hoek.escapeHtml(req.params.name);

	// Whether to force a refresh of the data
	const force = req.query.force === 'true';

	if (!name) {
		return h.response({ message: 'Missing name parameter' }).code(400);
	}

	const url = `https://www.realmeye.com/name-history-of-player/${name}`;
	const resp = await fetch(url)
		.then((r) => r.body)
		.then((r) => r.text());

	if (valid(resp)) {
		const document = parse(resp);

		const playerFound = !document
			.querySelector('body > div.container > div > div > h2')
			?.rawText?.startsWith('Sorry, but we either:');

		if (!playerFound) return h.response({ message: 'Player not found' }).code(404);

		const ret: PlayerNameHistory[] = [];

		const isPrivate =
			document.querySelector('body > div.container > div > div > h3')?.rawText === 'Rank history is not available';
		if (isPrivate) return h.response({ message: 'Rank history is not available' }).code(403);

		return h.response(ret).code(200);
	}

	return h.response({ message: 'Invalid html returned from server' }).code(500);
}

type PlayerNameHistory = {
	name: string;
	from?: string;
	to?: string;
};
