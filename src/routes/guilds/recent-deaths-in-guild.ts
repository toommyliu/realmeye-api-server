import type { HTMLElement } from 'node-html-parser';
import { Code, Message } from '../../constants.js';
import type { EquipmentSlotType, RealmeyeGuildRecentDeaths } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

const classMap: Map<number, string> = new Map([
	[768, 'Rogue'],
	[775, 'Archer'],
	[782, 'Wizard'],
	[784, 'Priest'],
	[785, 'Samurai'],
	[796, 'Bard'],
	[797, 'Warrior'],
	[798, 'Knight'],
	[800, 'Assassin'],
	[801, 'Necromancer'],
	[802, 'Huntress'],
	[803, 'Mystic'],
	[804, 'Trickster'],
	[805, 'Sorcerer'],
	[806, 'Ninja'],
	[817, 'Summoner'],
	[818, 'Kensei'],
]);

export const path = '/recent-deaths-in-guild/:name';
export function handle(document: HTMLElement) {
	const container = extractContainer(document)!;
	const name = extractName(container);

	const h2 = container.querySelector('h2');
	if (!name || h2?.rawText.startsWith('Sorry')) {
		return sendResponse({}, Code.GuildNotFound, Message.GuildNotFound);
	}

	const json: RealmeyeGuildRecentDeaths = { name, deaths: [] };
	const table = container.querySelectorAll('.table-responsive .table.table-striped.tablesorter tbody tr');
	for (const tr of table) {
		const td = tr.childNodes.map((c) => c.rawText);
		// @ts-expect-error
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
		const classId: string = tr.firstChild.childNodes[0]?.getAttribute('data-class') ?? '';
		const death: typeof json.deaths[0] = {
			name: td[1] ?? '',
			class: classMap.get(parseInt(classId, 10)) ?? 'Wizard',
			died_on: td[2] ?? '',
			base_fame: parseInt(td[3]!, 10) || 0,
			total_fame: parseInt(td[4]!, 10) || 0,
			equipment: [],
			stats: td[6] ?? '',
			killed_by: td[7] ?? '',
		};

		const equips = tr.querySelectorAll('.item-wrapper .item').map((c) => c.getAttribute('title'));
		for (let i = 0; i < equips.length; i++) {
			const item = equips[i]!;
			if (item === 'Empty slot') {
				death.equipment.push({ item, tier: '', type: i });
				continue;
			} else if (item === 'Backpack') {
				death.equipment.push({ item, tier: '', type: i });
				continue;
			}

			const index = item.lastIndexOf(' ');
			if (index !== -1) {
				const name = item.substring(0, index)!;
				const tier = item.substring(index + 1, item.length);

				death.equipment.push({ item: name, tier, type: i as EquipmentSlotType });
			}

			json.deaths.push(death);
		}
	}

	return sendResponse(json);
}
