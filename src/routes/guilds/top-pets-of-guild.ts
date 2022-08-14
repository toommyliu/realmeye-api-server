import type { HTMLElement } from 'node-html-parser';
import { Code, Message } from '../../constants.js';
import type { RealmeyeGuildTopPets } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

export const path = '/top-pets-of-guild/:name';
export function handle(document: HTMLElement) {
	const container = extractContainer(document)!;
	const name = extractName(container);

	const h2 = container.querySelector('h2');
	if (!name || h2?.rawText.startsWith('Sorry')) {
		return sendResponse({}, Code.GuildNotFound, Message.GuildNotFound);
	}

	const json: RealmeyeGuildTopPets = { name, pets: [] };
	const table = container.querySelectorAll('.table-responsive .table.table-striped.tablesorter tbody tr');
	for (const tr of table) {
		const td = tr.childNodes.map((c) => c.rawText);
		const abbrName = tr.getElementsByTagName('abbr')[0]?.getAttribute('title');

		const ability_1 = td[5] ?? '';
		const level_1 = parseInt(td[6]!, 10) || 0;
		const ability_2 = td[7] ?? '';
		const level_2 = parseInt(td[8]!, 10) || 0;
		const ability_3 = td[9] ?? '';
		const level_3 = parseInt(td[10]!, 10) || 0;
		const max_level = parseInt(td[11]!, 10) || 30;
		const owner = td[12];

		json.pets.push({
			place: parseInt(td[0]!, 10) || -1,
			name: abbrName ?? td[2] ?? '',
			rarity: td[3] ?? '',
			family: td[4] ?? '',
			abilities: [
				{
					ability: ability_1,
					unlocked: true,
					level: level_1,
					maxed: level_1 === max_level,
				},
				{
					ability: ability_2,
					unlocked: level_2 > 0,
					level: level_2,
					maxed: level_2 === max_level,
				},
				{
					ability: ability_3,
					unlocked: level_3 > 0,
					level: level_3,
					maxed: level_3 === max_level,
				},
			],
			max_level: max_level,
			owner: owner!,
		});
	}

	return sendResponse(json);
}
