import { parse } from 'node-html-parser';
import type { Request, Response } from 'polka';
import { Code, Message, get } from '../../constants.js';
import type { RealmeyePlayerPetYard } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

export const path = '/pets-of/:name';
export async function handle(req: Request, res: Response) {
	const _req = await get(req.path);
	const document = parse(_req.data as string);

	const container = extractContainer(document)!;
	const name = extractName(container);

	const h2 = container.querySelector('h2');
	if (!name || h2?.rawText === 'Sorry, but we either:') {
		return sendResponse(res, {}, Code.PlayerNotFound, Message.PlayerNotFound);
	}

	const h3 = container.getElementsByTagName('h3');
	if (h3[h3.length - 1]?.rawText === 'Pets are hidden.') {
		return sendResponse(res, {}, Code.PlayerDataUnavailable, Message.PlayerDataUnavailable);
	}

	const json: RealmeyePlayerPetYard = { name, pets: [] };

	const rows = container.querySelectorAll('.table-responsive .table.table-striped.tablesorter tbody tr')!;
	for (const row of rows) {
		const [, name, rarity, family, place, ability_1, level_1, ability_2, level_2, ability_3, level_3, max_level] =
			row.childNodes.map((c) => c.rawText);
		const abbrName = row.getElementsByTagName('abbr')[0]?.getAttribute('title');

		const pet: RealmeyePlayerPetYard['pets'][0] = {
			name: abbrName ?? name!,
			rarity: rarity!,
			family: family!,
			place: place ? parseInt(place, 10) : 0,
			abilities: [
				{
					ability: ability_1!,
					unlocked: true,
					level: level_1 ? parseInt(level_1, 10) : 0,
					maxed: level_1 === max_level,
				},
				{
					ability: ability_2!,
					unlocked: parseInt(level_2!, 10) > 0,
					level: parseInt(level_2!, 10),
					maxed: parseInt(level_2!, 10) === parseInt(max_level!, 10),
				},
				{
					ability: ability_3!,
					unlocked: parseInt(level_3!, 10) > 0,
					level: parseInt(level_3!, 10),
					maxed: parseInt(level_3!, 10) === parseInt(max_level!, 10),
				},
			],
			max_level: max_level ? parseInt(max_level, 10) : 0,
		};
		json.pets.push(pet);
	}

	return sendResponse(res, json);
}
