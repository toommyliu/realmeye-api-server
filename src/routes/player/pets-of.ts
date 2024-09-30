import type Hapi from '@hapi/hapi';
import { parse, valid } from 'node-html-parser';
import { fetch } from '../../util/fetch.js';
import * as Hoek from '@hapi/hoek';

export default {
	method: 'GET',
	path: '/api/player/{name}/pets-of',
	handler,
} satisfies Hapi.ServerRoute;

async function handler(req: Hapi.Request<Hapi.ReqRefDefaults>, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
	const name = Hoek.escapeHtml(req.params.name);

	if (!name) {
		return h.response({ message: 'Missing name parameter' }).code(400);
	}

	const force = req.query.force === 'true';

	const url = `https://www.realmeye.com/pets-of/${name}`;
	const resp = await fetch(url)
		.then((r) => r.body)
		.then((r) => r.text());

	if (valid(resp)) {
		const document = parse(resp);

		const playerFound = !document
			.querySelector('body > div.container > div > div > h2')
			?.rawText?.startsWith('Sorry, but we either:');

		if (!playerFound) return h.response({ message: 'Player not found' }).code(404);

		const ret: Partial<PlayerPetYard> = [];

		const tbl = document.querySelector('#e');
		const rows = tbl?.querySelectorAll('tbody tr');

		if (!tbl || !rows) return h.response({ message: 'Invalid html returned from server' }).code(500);

		for (const row of rows) {
			const [, name, rarity, family, place, ability_1, level_1, ability_2, level_2, ability_3, level_3, max_level] =
				row.childNodes.map((c) => c.rawText);

			const pet: Partial<Pet> = {
				name,
				rarity,
				family,
				place: Number.parseInt(place!, 10),
				abilities: [
					{
						ability: ability_1!,
						unlocked: true,
						level: level_1 ? Number.parseInt(level_1, 10) : 0,
						maxed: level_1 === max_level,
					},
					{
						ability: ability_2!,
						unlocked: Number.parseInt(level_2!, 10) > 0,
						level: Number.parseInt(level_2!, 10),
						maxed: Number.parseInt(level_2!, 10) === Number.parseInt(max_level!, 10),
					},
					{
						ability: ability_3!,
						unlocked: Number.parseInt(level_3!, 10) > 0,
						level: Number.parseInt(level_3!, 10),
						maxed: Number.parseInt(level_3!, 10) === Number.parseInt(max_level!, 10),
					},
				],
				max_level: Number.parseInt(max_level!, 10),
			};

			ret.push(pet as Pet);
		}

		return h.response(ret).code(200);
	}

	return h.response({ message: 'Invalid html returned from server' }).code(500);
}

type PlayerPetYard = Pet[];
type Pet = {
	name: string;
	rarity: string;
	family: string;
	place: number;
	abilities: {
		ability: string;
		level: number;
		maxed: boolean;
		unlocked: boolean;
	}[];
	max_level: number;
};
