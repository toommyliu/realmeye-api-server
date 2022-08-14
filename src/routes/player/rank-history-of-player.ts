import type { HTMLElement } from 'node-html-parser';
import { Code, Message } from '../../constants.js';
import type { RealmeyePlayerRankHistory } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

export const path = '/rank-history-of-player/:name';
export function handle(document: HTMLElement) {
	const container = extractContainer(document)!;
	const name = extractName(container);

	const h2 = container.querySelector('h2');
	if (!name || h2?.rawText === 'Sorry, but we either:') {
		return sendResponse({}, Code.PlayerNotFound, Message.PlayerNotFound);
	}

	const json: RealmeyePlayerRankHistory = {
		name,
		ranks: [],
	};

	const rows = container.querySelectorAll('.row .col-md-offset-1.col-md-6 .table-responsive .table tbody tr');
	for (const td of rows) {
		const tr = td.childNodes.map((c) => c.rawText);
		const [rank = '0', date = ''] = tr;
		const split = date.split('in ~').map((c) => c.trim());
		const starColor = td.querySelector('.star-container .star')?.rawAttrs;

		json.ranks.push({
			rank: parseInt(rank, 10) || 0,
			achieved: split[1]!,
			date: split[0]!,
			star: starColor!.slice(17).slice(0, -1),
		});
	}

	return sendResponse(json);
}
