import type { HTMLElement } from 'node-html-parser';
import { Code, Message } from '../../constants.js';
import type { RealmeyePlayerNameHistory } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

export const path = '/name-history-of-player/:name';
export function handle(document: HTMLElement) {
	const container = extractContainer(document)!;
	const name = extractName(container);

	const h2 = container.querySelector('h2');
	if (!name || h2?.rawText === 'Sorry, but we either:') {
		return sendResponse({}, Code.PlayerNotFound, Message.PlayerNotFound);
	}

	const h3 = container.getElementsByTagName('h3');
	if (h3[h3.length - 1]?.rawText === 'Name history is not available') {
		return sendResponse({}, Code.PlayerDataUnavailable, Message.PlayerDataUnavailable);
	}

	const p = container.getElementsByTagName('p')!;
	if (p[p.length - 1]?.rawText === 'No name changes detected.') {
		return sendResponse({}, Code.PlayerDataMissing, Message.PlayerDataMissing);
	}

	const json: RealmeyePlayerNameHistory = {
		name,
		names: [],
	};

	const rows = container.querySelector('.row .col-md-offset-1.col-md-6 .table-responsive .table tbody')!;
	for (const row of rows.childNodes) {
		const [name, from = '', to = ''] = row.childNodes.map((c) => c.rawText)!;
		json.names.push({ name: name!, from, to });
	}

	return sendResponse(json);
}
