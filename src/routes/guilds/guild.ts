import type { HTMLElement } from 'node-html-parser';
import { Code, Message } from '../../constants.js';
import type { RealmeyeGuild } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

export const path = '/guild/:name';
export function handle(document: HTMLElement) {
	const container = extractContainer(document)!;
	const name = extractName(container);

	const h2 = container.querySelector('h2');
	if (!name || h2?.rawText.startsWith('Sorry')) {
		return sendResponse({}, Code.GuildNotFound, Message.GuildNotFound);
	}

	const json: Partial<RealmeyeGuild> = { name, description: [], members: [] };

	// #region summary
	const summary = container.querySelector('.row .col-md-5 .summary');
	for (let i = 0; i < summary!.childNodes.length; i++) {
		const [, val] = summary!.childNodes[i]!.childNodes.map((c) => c.rawText)!;
		switch (i) {
			case 0:
				json.member_count = parseInt(val!, 10) || 0;
				break;
			case 1:
				json.character_count = parseInt(val!, 10) || 0;
				break;
			case 2:
				json.fame = parseInt(val!.split(' ')[0]!, 10) || 0;
				break;
			case 3:
				json.exp = parseInt(val!.split(' ')[0]!, 10) || 0;
				break;
			case 4:
				json.most_active_on = val!.split(' ')[0]! || '';
				break;
		}
	}
	// #endregion

	// #region description
	const description = container.querySelectorAll('.col-md-7 .well.description');
	for (const lines of description) {
		// @ts-expect-error
		if (lines.firstChild.rawAttrs === 'class="help"') break;
		json.description = lines.childNodes.map((c) => c.rawText);
	}
	// #endregion

	const table = container.querySelectorAll('.table-responsive .table.table-striped.tablesorter tbody tr');
	for (const tr of table) {
		const td = tr.childNodes.map((c) => c.rawText);
		const [name, guild_rank, fame, exp, rank, chars, last_seen, server, avg_fame_per_char, avg_exp_per_char] = td;
		const starColor = tr.querySelector('.star-container .star')?.rawAttrs;

		json.members!.push({
			name: name!,
			star: starColor?.slice(17).slice(0, -1) ?? 'light-blue',
			guild_rank: guild_rank!,
			fame: parseInt(fame!, 10) || 0,
			exp: parseInt(exp!, 10) || 0,
			rank: parseInt(rank!, 10) || 0,
			chars: parseInt(chars!, 10) || 0,
			last_seen: last_seen ?? '',
			server: server ?? '',
			avg_fame: parseInt(avg_fame_per_char!, 10) || 0,
			avg_exp: parseInt(avg_exp_per_char!, 10) || 0,
		});
	}

	return sendResponse(json);
}
