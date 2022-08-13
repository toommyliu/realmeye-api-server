import type { HTMLElement } from 'node-html-parser';
import { Code, Message } from '../../constants.js';
import type { EquipmentSlotType, RealmeyeCharacter, RealmeyePlayer } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

const summaryPlacementMap: Map<
	number,
	'character_count' | 'skin_count' | 'exaltation_count' | 'fame' | 'exp' | 'account_fame'
> = new Map([
	[0, 'character_count'],
	[1, 'skin_count'],
	[2, 'exaltation_count'],
	[3, 'fame'],
	[4, 'exp'],
	[6, 'account_fame'],
]);

export const path = '/player/:name';
export function handle(document: HTMLElement) {
	const container = extractContainer(document)!;
	const name = extractName(container);

	const h2 = container.querySelector('h2');
	if (!name || h2?.text === 'Sorry, but we either:') {
		return sendResponse({}, Code.PlayerNotFound, Message.PlayerNotFound);
	}

	const h3 = container.querySelector('h3');
	if (h3?.text === 'Characters are hidden') {
		return sendResponse({}, Code.PlayerDataUnavailable, Message.PlayerDataUnavailable);
	}

	const json: Partial<RealmeyePlayer> = { name };

	// #region summary table
	const summaryTable = container.querySelector('.row .col-md-5 .summary');
	for (let i = 0; i < summaryTable!.childNodes.length; i++) {
		const nodes = summaryTable!.childNodes[i]!.childNodes;
		const col = nodes[nodes.length - 2];
		const val = nodes[nodes.length - 1];

		switch (i) {
			case 0:
			case 1:
			case 2:
			case 3:
			case 4:
			case 6:
				{
					const split = val!.text.split(' ');
					const int = parseInt(split[0]!, 10);

					if (summaryPlacementMap.has(i)) {
						json[summaryPlacementMap.get(i)!] = int;
					}
				}
				break;
			case 7:
			case 8:
				// @ts-expect-error
				json[col!.text.toLowerCase()] = val!.text;
				break;
			default:
				// @ts-expect-error
				json[col!.text.toLowerCase()] = parseInt(val!.text, 10) || 0;
		}
	}
	// #endregion

	// #region nav bar
	const navBar = container.querySelector('.nav.nav-pills');
	const navBarItem = navBar!.childNodes.map((c) => c.rawText);
	for (let i = 0; i < navBarItem.length; i++) {
		const split = navBarItem[i]!.split(' ');
		if (!split.includes('Offer') || !split.includes('Pet')) continue;

		switch (i) {
			case 0:
				json['offer_count'] = parseInt(split[1]!.replace('(', '').replace(')', ''), 10) || 0;
				break;
			case 1:
				json['pet_count'] = parseInt(split[2]!.replace('(', '').replace(')', ''), 10) || 0;
				break;
		}
	}
	// #endregion

	// #region character tables
	const characterTable = container.querySelectorAll('.table-responsive .table.table-striped.tablesorter tbody tr');
	// eslint-disable-next-line @typescript-eslint/prefer-for-of
	for (let i = 0; i < characterTable.length; i++) {
		const char: RealmeyeCharacter = {};
		const charRow: string[] = characterTable[i]!.childNodes.map((c) => c.rawText);
		charRow.splice(0, 2);

		const [className, level, cqc, fame, exp, place, , stats, last_seen, , server] = charRow;

		char.class = className;
		char.level = parseInt(level!, 10) || 0;
		char.class_quests_completed = cqc;
		char.fame = parseInt(fame!, 10) || 0;
		char.exp = parseInt(exp!, 10) || 0;
		char.place = parseInt(place!, 10) || 0;
		char.stats = stats!;
		char.last_seen = last_seen;
		char.server = server!;
		char.equipment = [];

		const equips = characterTable[i]!.querySelectorAll('.item-wrapper .item').map((c) => c.getAttribute('title'));
		for (let i = 0; i < equips.length; i++) {
			const item = equips[i]!;
			if (item === 'Empty slot') {
				char.equipment.push({ item, tier: '', type: i });
				continue;
			}
			const index = item.lastIndexOf(' ');
			const name = item.substring(0, index)!;
			const tier = item.substring(index + 1, item.length);

			char.equipment.push({ item: name, tier, type: i as EquipmentSlotType });
		}

		json.characters ??= [];
		json.characters.push(char);
	}

	// #endregion
	return sendResponse(json);
}
