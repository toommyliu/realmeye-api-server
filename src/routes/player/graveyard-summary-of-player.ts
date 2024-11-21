import type Hapi from '@hapi/hapi';
import { parse, valid } from 'node-html-parser';
import { fetch } from '../../util/fetch.js';
import * as Hoek from '@hapi/hoek';

export default {
	method: 'GET',
	path: '/api/player/{name}/graveyard-summary',
	handler,
} satisfies Hapi.ServerRoute;

async function handler(req: Hapi.Request<Hapi.ReqRefDefaults>, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) {
	const name = Hoek.escapeHtml(req.params.name);

	if (!name) {
		return h.response({ message: 'Missing name parameter' }).code(400);
	}

	const force = req.query.force === 'true';

	const includeOtherAchivements = req.query.include_other_achievements === 'true';
	const includeStatsMaxedByClass = req.query.include_stats_maxed_by_class === 'true';

	const url = `https://www.realmeye.com/graveyard-summary-of-player/${name}`;
	const resp = await fetch(url)
		.then((r) => r.body)
		.then((r) => r.text());

	if (valid(resp)) {
		const document = parse(resp);

		const playerFound = !document
			.querySelector('body > div.container > div > div > h2')
			?.rawText?.startsWith('Sorry, but we either:');

		if (!playerFound) return h.response({ message: 'Player not found' }).code(404);

		const h3 = document.querySelector('body > div.container > div > div > h3')?.rawText;
		if (h3 === 'No data available yet.') return h.response({ message: 'No data available yet' }).code(403);
		else if (h3?.startsWith('The graveyard of '))
			return h.response({ message: 'Graveyard summary not available' }).code(403);

		const ret: Partial<PlayerGraveyardSummary> = {};

		{
			ret.main_achievements = {} as PlayerMainAchievements;

			const tbl = document.querySelector('#e');

			if (!tbl) return h.response({ message: 'Invalid html returned from server' }).code(500);

			// first node is the header?
			for (const row of tbl.childNodes.slice(1)) {
				const [, dungeonName, total, max, average, min] = row.childNodes.map((c) => c.rawText);

				const ret_: Partial<PlayerMainAchievementRow> = {
					total: Number.parseInt(total!, 10),
					max: Number.parseInt(max!, 10),
					average: Number.parseInt(average!, 10),
					min: Number.parseInt(min!, 10),
				};

				ret_.name = (dungeonName!
					.replace(/[0-9]/g, '') // remove numbers (remarks)
					.replace(String.fromCharCode(160), ' ') // remove &nbsp;
					.replace('&apos;s', '') // remove apostrophe
					.split(' ')
					.map((s) => s.toLowerCase())
					.join('_') as keyof PlayerMainAchievements)!;

				// @ts-expect-error
				ret.main_achievements[ret_.name] = ret_ as PlayerMainAchievementRow;
			}
		}

		if (includeOtherAchivements) {
			ret.other_achievements = {};
		}

		if (includeStatsMaxedByClass) {
			ret.stats_maxed_by_class = {};
		}

		return h.response(ret).code(200);
	}

	return h.response({ message: 'Invalid html returned from server' }).code(500);
}

type PlayerGraveyardSummary = {
	main_achievements: PlayerMainAchievements;
	other_achievements: PlayerOtherAchievements;
	stats_maxed_by_class: PlayerMaxedByClassStats;
};

type PlayerMainAchievements = {
	base_fame: PlayerMainAchievementRow;
	total_fame: PlayerMainAchievementRow;
	oryx_kills: PlayerMainAchievementRow;
	god_kills: PlayerMainAchievementRow;
	monster_kills: PlayerMainAchievementRow;
	quests_completed: PlayerMainAchievementRow;
	tiles_uncovered: PlayerMainAchievementRow;
	lost_halls_completed: PlayerMainAchievementRow;
	voids_completed: PlayerMainAchievementRow;
	cultist_hideouts_completed: PlayerMainAchievementRow;
	nests_completed: PlayerMainAchievementRow;
	shatters_completed: PlayerMainAchievementRow;
	tombs_completed: PlayerMainAchievementRow;
	ocean_trenches_completed: PlayerMainAchievementRow;
	parasite_chambers_completed: PlayerMainAchievementRow;
	lairs_of_shaitan_completed: PlayerMainAchievementRow;
	puppet_masters_encores_completed: PlayerMainAchievementRow;
	cnidarian_reefs_completed: PlayerMainAchievementRow;
	secluded_thickets_completed: PlayerMainAchievementRow;
	cursed_libraries_completed: PlayerMainAchievementRow;
	crystal_caverns_completed: PlayerMainAchievementRow;
	'lairs_of_draconis_(hard_mode)_completed': PlayerMainAchievementRow;
	'lairs_of_draconis_(easy_mode)_completed': PlayerMainAchievementRow;
	mountain_temples_completed: PlayerMainAchievementRow;
	crawling_depths_completed: PlayerMainAchievementRow;
	woodland_labyrinths_completed: PlayerMainAchievementRow;
	deadwater_docks_completed: PlayerMainAchievementRow;
	ice_caves_completed: PlayerMainAchievementRow;
	bella_donnas_completed: PlayerMainAchievementRow;
	davy_jones_lockers_completed: PlayerMainAchievementRow;
	battle_for_the_nexuses_completed: PlayerMainAchievementRow;
	candyland_hunting_grounds_completed: PlayerMainAchievementRow;
	puppet_master_theatres_completed: PlayerMainAchievementRow;
	toxic_sewers_completed: PlayerMainAchievementRow;
	haunted_cemeteries_completed: PlayerMainAchievementRow;
	mad_labs_completed: PlayerMainAchievementRow;
	abysses_of_demons_completed: PlayerMainAchievementRow;
	manors_of_the_immortals_completed: PlayerMainAchievementRow;
	ancient_ruins_completed: PlayerMainAchievementRow;
	undead_lairs_completed: PlayerMainAchievementRow;
	sprite_worlds_completed: PlayerMainAchievementRow;
	snake_pits_completed: PlayerMainAchievementRow;
	caves_of_a_thousand_treasures_completed: PlayerMainAchievementRow;
	magic_woods_completed: PlayerMainAchievementRow;
	hives_completed: PlayerMainAchievementRow;
	spider_dens_completed: PlayerMainAchievementRow;
	forbidden_jungles_completed: PlayerMainAchievementRow;
	forest_mazes_completed: PlayerMainAchievementRow;
	pirate_caves_completed: PlayerMainAchievementRow;
};
type PlayerMainAchievementRow = {
	name: string;
	total: number;
	max: number;
	average: number;
	min: number;
};
type PlayerOtherAchievements = {};
type PlayerMaxedByClassStats = {};
