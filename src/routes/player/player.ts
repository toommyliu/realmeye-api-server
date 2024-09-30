import type Hapi from '@hapi/hapi';
import { parse, valid } from 'node-html-parser';
import { fetch } from '../../util/fetch.js';
import * as Hoek from '@hapi/hoek';

export default {
	method: 'GET',
	path: '/api/player/{name}',
	handler,
} satisfies Hapi.ServerRoute;

async function handler(req: Hapi.Request<Hapi.ReqRefDefaults>, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
	const name = Hoek.escapeHtml(req.params.name);

	// Whether we should include character data
	const includeCharacters = req.query.include_characters === 'true';
	// Whether we should include data from the navigation bar (below the summary table)
	const includeNav = req.query.include_nav === 'true';
	// Whether to force a refresh of the data
	const force = req.query.force === 'true';

	if (!name) {
		return h.response({ message: 'Missing name parameter' }).code(400);
	}

	const url = `https://www.realmeye.com/player/${name}`;
	const resp = await fetch(url)
		.then((r) => r.body)
		.then((r) => r.text());

	if (valid(resp)) {
		const document = parse(resp);

		const playerFound = !document
			.querySelector('body > div.container > div > div > h2')
			?.rawText?.startsWith('Sorry, but we either:');

		if (!playerFound) return h.response({ message: 'Player not found' }).code(404);

		const ret: Partial<Player> = {};
		if (includeCharacters) ret.characters = [];

		const realName = document.querySelector('body > div.container > div > div > h1 > span');
		ret.name = realName?.rawText ?? name ?? null;

		{
			const container = document.querySelector('body > div.container > div > div > div.row > div.col-md-5');
			const tbl = container?.childNodes[0];

			if (tbl?.childNodes.length) {
				for (const tr of tbl?.childNodes) {
					const tds = tr.childNodes;
					if (tds.length === 2) {
						const [k, v] = tds.map((td) => td.rawText);
						switch (k?.toLowerCase()) {
							case 'characters':
								ret.character_count = Number.parseInt(v!, 10);
								break;
							case 'skins':
								{
									//30 (51292nd)
									const [skins, skins_placement] = v!.split(' (');
									ret.skins_count = Number.parseInt(skins!, 10);
									if (skins_placement) ret.skins_placement = Number.parseInt(skins_placement!.slice(0, -1), 10);
								}
								break;
							case 'exaltations':
								ret.exaltations = Number.parseInt(v!, 10);
								break;
							case 'fame':
								{
									// 12337 (12337nd)
									const [fame, fame_placement] = v!.split(' (');
									ret.fame = Number.parseInt(fame!, 10);
									if (fame_placement) ret.fame_placement = Number.parseInt(fame_placement!.slice(0, -1), 10);
								}
								break;
							case 'rank':
								ret.rank = Number.parseInt(v!, 10);
								break;
							case 'account fame':
								{
									// 12337 (12337nd)
									const [account_fame, account_fame_placement] = v!.split(' (');
									ret.account_fame = Number.parseInt(account_fame!, 10);
									if (account_fame_placement)
										ret.account_fame_placement = Number.parseInt(account_fame_placement!.slice(0, -1), 10);
								}
								break;
							case 'guild':
								ret.guild = v;
							case 'guild rank':
								ret.guild_rank = v;
								break;
							case 'first seen':
								break;
							case 'last seen':
								break;
						}
					}
				}
			}
		}

		const description: [string, string, string] = [] as unknown as [string, string, string];
		for (let i = 0; i < 3; ++i) {
			const line = document.querySelector(`#d > div.line${i + 1}.description-line`);
			if (line) description.push(line.rawText);
		}
		ret.description = description.filter((d) => d !== null) as unknown as [string, string, string];

		if (includeCharacters) {
			const tbl = document.querySelectorAll(
				'.container .row .col-md-12 .table-responsive .table.table-striped.tablesorter tbody tr',
			);
			for (let i = 0; i < tbl.length; i++) {
				const char: Partial<Character> = {};
				const charRow: string[] = tbl[i]!.childNodes.map((c) => c.rawText);
				const skin = tbl[i]?.querySelector('.character')?.rawAttributes;

				let startIndex = 0;

				for (let j = 0; j < charRow.length; j++) {
					if (charRow[j] === '') {
						console.log('empty element found at index ' + j);
						startIndex = j + 1; // If the first element is empty, start from the next index
					}
				}

				console.log(charRow);

				char.class_name = charRow[startIndex]!;
				char.level = Number.parseInt(charRow[startIndex + 1]!, 10);
				char.fame = Number.parseInt(charRow[startIndex + 2]!, 10);
				char.rank = Number.parseInt(charRow[startIndex + 3]!, 10);
				char.stats = charRow[startIndex + 5]!;
				char.last_seen = charRow[startIndex + 6]!;
				if (charRow[startIndex + 7] !== '') char.server = charRow[startIndex + 7]!;

				// char.equipment = [];
				// // @ts-expect-error
				// char.skin = {
				// 	// @ts-expect-error
				// 	accessoryDyeId: parseInt(skin['data-accessory-dye-id'], 10) || 0, // @ts-expect-error
				// 	clothingDyeId: parseInt(skin['data-clothing-dye-id'], 10) || 0, // @ts-expect-error
				// 	skinId: parseInt(skin['data-skin'], 10) || 0,
				// };

				// const equips = tbl[i]!.querySelectorAll('.item-wrapper .item').map((c) => c.getAttribute('title'));
				// for (let i = 0; i < equips.length; i++) {
				// 	const item = equips[i]!;
				// 	if (item === 'Empty slot') {
				// 		// @ts-expect-error
				// 		char.equipment.push({ item, tier: '', type: i });
				// 		continue;
				// 	}
				// 	const index = item.lastIndexOf(' ');
				// 	const name = item.substring(0, index)!;
				// 	const tier = item.substring(index + 1, item.length);

				// 	// @ts-expect-error
				// 	char.equipment.push({ item: name, tier, type: i as EquipmentSlotType });
				// }

				// console.log(char);
				ret.characters!.push(char as Character);
			}
		}

		if (includeNav) {
			const ul = document.querySelector('body > div.container > div > div > ul');
			if (ul) {
				const lis = ul.childNodes.filter((n) => n.rawTagName === 'li');
				if (lis.length) {
					for (const li of lis) {
						const a = li.childNodes[0];
						if (a && a.rawText?.includes(' ')) {
							const str = a.rawText.trim();
							const lastIdx = str.lastIndexOf(' ');

							const k = str.slice(0, lastIdx).trim();
							const v = str.slice(lastIdx + 1).trim();

							switch (k!.toLowerCase()) {
								case 'offers':
								case 'pet yard':
									const openParenIndex = v!.indexOf('(');
									const closeParenIndex = v!.indexOf(')', openParenIndex);

									if (openParenIndex !== -1 && closeParenIndex !== -1 && openParenIndex < closeParenIndex) {
										if (k!.toLowerCase() === 'offers')
											ret.offer_count = Number.parseInt(v!.substring(openParenIndex + 1, closeParenIndex), 10);
										else if (k!.toLowerCase() === 'pet yard')
											ret.pet_count = Number.parseInt(v!.substring(openParenIndex + 1, closeParenIndex), 10);
									}

									break;
							}
						}
					}
				}
			}
		}

		return h.response(ret).code(200);
	}

	return h.response({ message: 'Invalid html returned from server' }).code(500);
}

type Player = {
	name: string;
	character_count?: number;
	skins_count?: number;
	skins_placement?: number;
	exaltations?: number;
	fame?: number;
	fame_placement?: number;
	rank?: number; // stars
	account_fame?: number;
	account_fame_placement?: number;
	guild?: string;
	guild_rank?: string;
	offer_count?: number;
	pet_count?: number;
	characters?: Character[];
	description: [string, string, string];
};
type Character = {
	class_name: string;
	level: number;
	fame: number;
	/**
	 * The rank of the character on this class leaderboard.
	 */
	rank: number;
	equipment: Item[];
	stats: string;
	last_seen?: string;
	server?: string;
};
type Item = {
	item_name: string;
	tier: string;
	slot: number;
};
