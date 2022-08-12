import { parse } from 'node-html-parser';
import type { Request, Response } from 'polka';
import { Code, Message, get } from '../../constants.js';
import type { RealmeyePlayerNameHistory } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

export const path = '/name-history-of-player/:name';
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
	if (h3[h3.length - 1]?.rawText === 'Name history is not available') {
		return sendResponse(res, {}, Code.PlayerDataUnavailable, Message.PlayerDataUnavailable);
	}

	const p = container.getElementsByTagName('p')!;
	if (p[p.length - 1]?.rawText === 'No name changes detected.') {
		return sendResponse(res, {}, Code.PlayerDataMissing, Message.PlayerDataMissing);
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

	return sendResponse(res, json);
}
