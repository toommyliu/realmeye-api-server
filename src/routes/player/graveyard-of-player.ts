import type { HTMLElement } from 'node-html-parser';
import { Code, Message } from '../../constants.js';
import type { EquipmentSlot, EquipmentSlotType } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

export const path = '/graveyard-of-player/:name';
export function handle(document: HTMLElement) {
	const container = extractContainer(document)!;
	const name = extractName(container);

	const h2 = container.querySelector('h2');
	if (!name || h2?.rawText === 'Sorry, but we either:') {
		return sendResponse({}, Code.PlayerNotFound, Message.PlayerNotFound);
	}

	const h3 = container.querySelector('h3');
	if (h3?.rawText.startsWith('The graveyard of')) {
		return sendResponse({}, Code.PlayerDataUnavailable, Message.PlayerDataUnavailable);
	}

	const json: Partial<PlayerGraveyard> = { graves: [] };

	const p = container.querySelector('p:nth-child(8)');
	json.grave_count = parseInt(p!.getElementsByTagName('strong')[0]!.rawText, 10) || 0;

	const graveyardTable = container.querySelectorAll('.table-responsive .table.table-striped.tablesorter tbody tr');
	for (let i = 0; i < graveyardTable.length; i++) {
		switch (i) {
		}

		const death_info: Partial<GraveInfo> = {};
		death_info.died_on = graveyardTable[i]!.childNodes[0]!.rawText;
		death_info.class = graveyardTable[i]!.childNodes[2]!.rawText;
		death_info.level = parseInt(graveyardTable[i]!.childNodes[3]!.rawText, 10) || 1;
		death_info.base_fame = parseInt(graveyardTable[i]!.childNodes[4]!.rawText, 10) || 0;
		death_info.total_fame = parseInt(graveyardTable[i]!.childNodes[5]!.rawText, 10) || 0;
		death_info.experience = parseInt(graveyardTable[i]!.childNodes[6]!.rawText, 10) || 0;
		death_info.equipment = [];
		death_info.stats = graveyardTable[i]!.childNodes[8]!.rawText;
		death_info.killed_by = graveyardTable[i]!.childNodes[9]!.rawText;

		const equips = graveyardTable[i]!.querySelectorAll('.item-wrapper .item').map((c) => c.getAttribute('title'));
		for (let i = 0; i < equips.length; i++) {
			const item = equips[i]!;
			if (item === 'Empty slot') {
				death_info.equipment.push({ item, tier: '', type: i });
				continue;
			} else if (item === 'Backpack') {
				death_info.equipment.push({ item, tier: '', type: i });
				continue;
			}

			const index = item.lastIndexOf(' ');
			if (index !== -1) {
				const name = item.substring(0, index)!;
				const tier = item.substring(index + 1, item.length);

				death_info.equipment.push({ item: name, tier, type: i as EquipmentSlotType });
			}
		}

		// @ts-expect-error
		json.graves?.push(death_info);
	}

	return sendResponse(json);
}

export interface PlayerGraveyard {
	grave_count: number;
	graves: GraveInfo[];
}

export interface GraveInfo {
	died_on: string;
	class: string;
	level: number;
	base_fame: number;
	total_fame: number;
	experience: number;
	equipment: EquipmentSlot[];
	stats: string;
	killed_by: string;
}
