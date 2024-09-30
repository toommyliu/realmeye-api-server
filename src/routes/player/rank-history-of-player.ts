import type Hapi from '@hapi/hapi';
import { parse, valid } from 'node-html-parser';
import { fetch } from '../../util/fetch.js';
import * as Hoek from '@hapi/hoek';

export default async function (req: Hapi.Request<Hapi.ReqRefDefaults>, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
	const name = Hoek.escapeHtml(req.params.name);

	// Whether to force a refresh of the data
	const force = req.query.force === 'true';

	if (!name) {
		return h.response({ message: 'Missing name parameter' }).code(400);
	}

	const url = `https://www.realmeye.com/rank-history-of-player/${name}`;
	const resp = await fetch(url)
		.then((r) => r.body)
		.then((r) => r.text());

	if (valid(resp)) {
		const document = parse(resp);

		const playerFound = !document
			.querySelector('body > div.container > div > div > h2')
			?.rawText?.startsWith('Sorry, but we either:');

		if (!playerFound) return h.response({ message: 'Player not found' }).code(404);

		const ret: PlayerRankHistory[] = [];

		const isPrivate =
			document.querySelector('body > div.container > div > div > h3')?.rawText === 'Rank history is not available';
		if (isPrivate) return h.response({ message: 'Rank history is not available' }).code(403);

		const tbl = document.querySelector('#e');
		const tbody = tbl?.querySelector('tbody');
		if (!tbl || !tbody) return h.response({ message: 'Invalid html returned from server' }).code(500);

		for (const row of tbody.childNodes) {
			const [rank, achieved_str] = row.childNodes.map((c) => c.rawText);
			// @ts-expect-error -> star star-light-blue
			const star_clr = row.childNodes[0]?.childNodes[0]?.childNodes[1]?.rawAttrs;
			console.log(star_clr);

			// 2024-09-26 17:31:32 in ~ 11 days 16 hours 43 minutes
			const split = achieved_str!.split(' in ~ ');

			// 2024-09-26 17:31:32
			const date_and_time = split[0]!;

			const date = date_and_time.split(' ')[0]!;
			const time = date_and_time.split(' ')[1]!;
			const elapsed_time = split[1]!;

			const ret_: PlayerRankHistory = {
				rank: Number.parseInt(rank!, 10),
				achieved_date: date,
				achieved_time: time,
				star_color: star_clr!
					.slice(17) /* remove class unused classes */
					.slice(0, -1) /* remove trailing double quote */
					.replace('-', '_'),
			};

			// Not available at Rank 1
			if (elapsed_time) {
				ret_.elapsed_time = elapsed_time;
			}

			ret.push(ret_);
		}

		return h.response(ret).code(200);
	}

	return h.response({ message: 'Invalid html returned from server' }).code(500);
}

type PlayerRankHistory = {
	rank: number;
	star_color: string;
	achieved_date: string;
	achieved_time: string;
	elapsed_time?: string;
};
