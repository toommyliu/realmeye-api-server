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
			document.querySelector('body > div.container > div > div > h3')?.rawText === 'Name history is not available';
		if (isPrivate) return h.response({ message: 'Name history is not available' }).code(403);

		const hasNoNameHistory =
			document.querySelector('body > div.container > div > div > p:nth-child(8)')?.rawText ===
			'No name changes detected.';
		if (hasNoNameHistory) return h.response({ message: 'No name changes detected' }).code(404);

		const tbl = document.querySelector('#e');
		const tbody = tbl?.querySelector('tbody');
		if (!tbl || !tbody) return h.response({ message: 'Invalid html returned from server' }).code(500);

		for (const row of tbody.childNodes) {
			const [name, from, to] = row.childNodes.map((c) => c.rawText);

			const ret_: PlayerNameHistory = {
				name: name!,
			};

			// The player's first name doesn't have a "from" date
			if (from != '') {
				ret_.from = from;
			}

			// The player's latest name doesn't have an "up to" date as it's their current name
			if (to != '') {
				ret_.to = to;
			}

			ret.push(ret_);
		}

		return h.response(ret).code(200);
	}

	return h.response({ message: 'Invalid html returned from server' }).code(500);
}

type PlayerNameHistory = {
	name: string;
	from?: string;
	to?: string;
};
