import type { HTMLElement } from 'node-html-parser';
import { Code, Message } from '../../constants.js';
import type { RealmeyeGuildFormerMembers } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

export const path = '/former-members-of-guild/:name';
export function handle(document: HTMLElement) {
	const container = extractContainer(document)!;
	const name = extractName(container);

	const h2 = container.querySelector('h2');
	if (!name || h2?.rawText.startsWith('Sorry')) {
		return sendResponse({}, Code.GuildNotFound, Message.GuildNotFound);
	}

	const json: RealmeyeGuildFormerMembers = { name, former_members: [] };
	const table = container.querySelectorAll('.table-responsive .table-striped.tablesorter tbody tr');

	for (const tr of table) {
		const td = tr.childNodes.map((c) => c.rawText);
		if (td[0] === 'Private') continue;
		const starColor = tr.querySelector('.star-container .star')?.rawAttrs;

		json.former_members.push({
			name: td[0] ?? '',
			star: starColor?.slice(17).slice(0, -1) ?? 'light-blue',
			guild_rank: td[1] ?? 'Initiate',
			left_at: td[2] ?? '',
			current_guild: td[3],
			fame: parseInt(td[4]!, 10) || 0,
			exp: parseInt(td[5]!, 10) || 0,
			rank: parseInt(td[6]!, 10) || 0,
			character_count: parseInt(td[7]!, 10) || 0,
			last_seen: td[8],
			server: td[9],
		});
	}

	return sendResponse(json);
}
