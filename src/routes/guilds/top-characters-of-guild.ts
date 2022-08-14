import type { HTMLElement } from 'node-html-parser';
import { Code, Message } from '../../constants.js';
import type { RealmeyeGuildTopCharacter, RealmeyeGuildTopCharacters, EquipmentSlotType } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

export const path = '/top-characters-of-guild/:name';
export function handle(document: HTMLElement) {
	const container = extractContainer(document)!;
	const name = extractName(container);

	const h2 = container.querySelector('h2');
	if (!name || h2?.rawText.startsWith('Sorry')) {
		return sendResponse({}, Code.GuildNotFound, Message.GuildNotFound);
	}

	const json: RealmeyeGuildTopCharacters = { name, characters: [] };
	const table = container.querySelectorAll('.table-responsive .table.table-striped.tablesorter tbody tr');
	for (const tr of table) {
		const td = tr.childNodes.map((c) => c.rawText);
		const char: RealmeyeGuildTopCharacter = {
			name: td[2] ?? '',
			fame: parseInt(td[3]!, 10) || 0,
			exp: parseInt(td[4]!, 10) || 0,
			class: td[5] ?? '',
			stats: td[7] ?? '',
			last_seen: td[8] ?? '',
			server: td[9] ?? '',
			equipment: [],
		};

		if (char.name === 'Private') {
			json.characters.push(char);
			continue;
		}

		const equipment = tr.querySelectorAll('.item-wrapper .item').map((c) => c.getAttribute('title'));

		for (let i = 0; i < equipment.length; i++) {
			const item = equipment[i]!;
			if (item === 'Empty slot') {
				char.equipment.push({ item, tier: '', type: i });
				continue;
			}
			const index = item.lastIndexOf(' ');
			const name = item.substring(0, index)!;
			const tier = item.substring(index + 1, item.length);

			char.equipment.push({ item: name, tier, type: i as EquipmentSlotType });
		}

		json.characters.push(char);
	}

	return sendResponse(json);
}
