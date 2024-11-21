import type Hapi from '@hapi/hapi';
import { parse, valid } from 'node-html-parser';
import { fetch } from '../../util/fetch.js';
import * as Hoek from '@hapi/hoek';

export default {
	method: 'GET',
	path: '/api/player/{name}/guild-history-of',
	handler,
} satisfies Hapi.ServerRoute;

async function handler(req: Hapi.Request<Hapi.ReqRefDefaults>, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
	const name = Hoek.escapeHtml(req.params.name);

	// Whether to force a refresh of the data
	const force = req.query.force === 'true';

	if (!name) {
		return h.response({ message: 'Missing name parameter' }).code(400);
	}

	const url = `https://www.realmeye.com/guild-history-of-player/${name}`;
	const resp = await fetch(url)
		.then((r) => r.body)
		.then((r) => r.text());

	if (valid(resp)) {
		const document = parse(resp);

		const playerFound = !document
			.querySelector('body > div.container > div > div > h2')
			?.rawText?.startsWith('Sorry, but we either:');

		if (!playerFound) return h.response({ message: 'Player not found' }).code(404);

		const ret: PlayerGuildHistory[] = [];

		const isPrivate =
			document.querySelector('body > div.container > div > div > h3')?.rawText === 'Guild history is not available';
		if (isPrivate) return h.response({ message: 'Guild history is not available' }).code(403);

		const hasNoGuildHistory =
			document.querySelector('body > div.container > div > div > p:nth-child(8)')?.rawText ===
			'No guild changes detected.';
		if (hasNoGuildHistory) return h.response({ message: 'No guild history detected' }).code(404);

		const tbl = document.querySelector('#e');
		const tbody = tbl?.querySelector('tbody');
		if (!tbl || !tbody) return h.response({ message: 'Invalid html returned from server' }).code(500);

		for (const row of tbody.childNodes) {
			const [guild, rank, from, to] = row.childNodes.map((c) => c.rawText);

			const ret_: Partial<PlayerGuildHistory> = {};

			if (guild !== 'Not in a guild') {
				ret_.guild = guild!;
			} else {
				ret_.guild = null; // the player is not in a guild in this period
			}

			if (rank !== '') {
				ret_.rank = rank;
			}

			if (from !== '') {
				ret_.date_from = from;
			}

			if (to !== '') {
				ret_.date_to = to;
			}

			ret.push(ret_ as PlayerGuildHistory);
		}

		return h.response(ret).code(200);
	}

	return h.response({ message: 'Invalid html returned from server' }).code(500);
}

type PlayerGuildHistory = {
	guild: string | null;
	rank?: string;
	date_from?: string;
	date_to?: string;
};
