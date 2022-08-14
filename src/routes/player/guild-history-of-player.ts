import type { HTMLElement } from 'node-html-parser';
import { Code, Message } from '../../constants.js';
import type { RealmeyePlayerGuildHistory } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

export const path = '/guild-history-of-player/:name';
export function handle(document: HTMLElement) {
	const container = extractContainer(document)!;
	const name = extractName(container);

	const h2 = container.querySelector('h2');
	if (!name || h2?.rawText === 'Sorry, but we either:') {
		return sendResponse({}, Code.PlayerNotFound, Message.PlayerNotFound);
	}

	const h3 = container.querySelector('h3');
	if (h3?.text === 'Guild history is not available') {
		return sendResponse({}, Code.PlayerDataUnavailable, Message.PlayerDataUnavailable);
	}

	const json: RealmeyePlayerGuildHistory = { name, guilds: [] };
	const table = container.querySelectorAll('.row .col-md-offset-1.col-md-7 .table-responsive .table tbody tr');

	for (const tr of table) {
		const td = tr.childNodes.map((c) => c.rawText);
		const [guild = '', rank = '', from = '', to = ''] = td;
		json.guilds.push({ guild, rank, from, to });
	}

	return sendResponse(json);
}
