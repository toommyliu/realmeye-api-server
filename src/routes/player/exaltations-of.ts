import { parse } from 'node-html-parser';
import type { Request, Response } from 'polka';
import { Code, Message, get } from '../../constants.js';
import type { ClassExaltation } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

export const path = '/exaltations-of/:name';
export async function handle(req: Request, res: Response) {
	const _req = await get(req.path);
	const document = parse(_req.data as string);

	const container = extractContainer(document)!;
	const name = extractName(container);

	const h2 = container.querySelector('h2');
	if (!name || h2?.rawText === 'Sorry, but we either:') {
		return sendResponse(res, {}, Code.PlayerNotFound, Message.PlayerNotFound);
	}

	const h3 = container.querySelector('h3');
	if (h3?.rawText === 'No exaltations') {
		return sendResponse(res, {}, Code.PlayerDataMissing, Message.PlayerDataMissing);
	} else if (h3?.rawText === 'Exaltations are hidden') {
		return sendResponse(res, {}, Code.PlayerDataUnavailable, Message.PlayerDataUnavailable);
	}

	const split = h3!.rawText.substring(13).split(' / ');
	const current = parseInt(split[0]!, 10);
	const split_ = split[split.length - 1]!.replace(String.fromCharCode(160), ' ').split(' ');
	const remaining = parseInt(split_[0]!, 10);
	const percentage = Math.floor((current / remaining) * 100).toFixed(1);

	const exaltations: ClassExaltation[] = [];
	const rows = container.querySelectorAll('.table-responsive .table.table-striped.tablesorter tbody tr');

	for (const row of rows) {
		const [, name, total, hp, mp, attack, defense, speed, dexterity, vitality, wisdom] = row.childNodes.map(
			(c) => c.rawText
		);

		exaltations.push({
			class: name ?? '',
			total: total ? parseInt(total, 10) : 0,
			health: hp ? parseInt(hp, 10) / 5 : 0,
			mana: mp ? parseInt(mp, 10) / 5 : 0,
			attack: attack ? parseInt(attack, 10) : 0,
			defense: defense ? parseInt(defense, 10) : 0,
			speed: speed ? parseInt(speed, 10) : 0,
			dexterity: dexterity ? parseInt(dexterity, 10) : 0,
			vitality: vitality ? parseInt(vitality, 10) : 0,
			wisdom: wisdom ? parseInt(wisdom, 10) : 0,
		});
	}

	const json = {
		name,
		current_exaltations: current,
		remaining_exaltations: remaining,
		percentage,
		exaltations,
	};
	return sendResponse(res, json);
}
