import type Hapi from '@hapi/hapi';
import { parse, valid } from 'node-html-parser';
import { fetch } from '../../util/fetch.js';
import * as Hoek from '@hapi/hoek';

export default {
	method: 'GET',
	path: '/api/player/{name}/exaltations-of',
	handler,
} satisfies Hapi.ServerRoute;

async function handler(req: Hapi.Request<Hapi.ReqRefDefaults>, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
	const name = Hoek.escapeHtml(req.params.name);

	// Whether to force a refresh of the data
	const force = req.query.force === 'true';

	if (!name) {
		return h.response({ message: 'Missing name parameter' }).code(400);
	}

	const url = `https://www.realmeye.com/exaltations-of/${name}`;
	const resp = await fetch(url)
		.then((r) => r.body)
		.then((r) => r.text());

	if (valid(resp)) {
		const document = parse(resp);

		const playerFound = !document
			.querySelector('body > div.container > div > div > h2')
			?.rawText?.startsWith('Sorry, but we either:');

		if (!playerFound) return h.response({ message: 'Player not found' }).code(404);

		const ret: Partial<PlayerExaltation> = { classes: [] };

		const isPrivate =
			document.querySelector('body > div.container > div > div > h3')?.rawText === 'Exaltations are hidden';
		if (isPrivate) return h.response({ message: 'Exaltations are not available' }).code(403);

		const hasNoExaltations =
			document.querySelector('body > div.container > div > div > h3')?.rawText === 'No exaltations';
		if (hasNoExaltations) return h.response({ message: 'No exaltations detected' }).code(404);

		{
			const exaltationsStr = document.querySelector('body > div.container > div > div > h3')?.rawText;
			// Exaltations: 720 / 720&nbsp;100.0%
			const split = exaltationsStr!.substring(13).split(' / ');
			const current = Number.parseInt(split[0]!, 10);
			const split_ = split[split.length - 1]!.replace(String.fromCharCode(160) /* &nbsp */, '').split('%');
			const remaining = Number.parseInt(split_[0]!, 10);

			ret.current = current; // 720
			ret.remaining = remaining; // 720
		}

		const tbl = document.querySelector('#e');
		const tbody = tbl?.querySelector('tbody');
		if (!tbl || !tbody) return h.response({ message: 'Invalid html returned from server' }).code(500);

		for (const row of tbody.childNodes) {
			const [, name, total, hp, mp, attack, defense, speed, dexterity, vitality, wisdom] = row.childNodes.map(
				(c) => c.rawText,
			);

			const ret_: Partial<ClassExaltation> = {
				class_name: name ?? '',
				total: total ? Number.parseInt(total, 10) : 0,
				health: hp ? Number.parseInt(hp, 10) / 5 : 0,
				mana: mp ? Number.parseInt(mp, 10) / 5 : 0,
				attack: attack ? Number.parseInt(attack, 10) : 0,
				defense: defense ? Number.parseInt(defense, 10) : 0,
				speed: speed ? Number.parseInt(speed, 10) : 0,
				dexterity: dexterity ? Number.parseInt(dexterity, 10) : 0,
				vitality: vitality ? Number.parseInt(vitality, 10) : 0,
				wisdom: wisdom ? Number.parseInt(wisdom, 10) : 0,
			};

			// this hasn't changed for some time, should be fine to hardcode it
			if (ret_.total === 40) {
				ret_.is_maxed = true;
			}

			ret.classes!.push(ret_ as ClassExaltation);
		}

		return h.response(ret).code(200);
	}

	return h.response({ message: 'Invalid html returned from server' }).code(500);
}

type PlayerExaltation = {
	current: number;
	remaining: number;
	classes: ClassExaltation[];
};
type ClassExaltation = {
	class_name: string;
	total: number;
	health: number;
	mana: number;
	attack: number;
	defense: number;
	speed: number;
	dexterity: number;
	vitality: number;
	wisdom: number;
	is_maxed: boolean;
};
