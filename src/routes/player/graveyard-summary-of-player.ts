import type { HTMLElement } from 'node-html-parser';
import { Code, Message } from '../../constants.js';
import type { MaxedStatsByClass, RealmeyePlayerGraveyardSummary } from '../../types/index.js';
import { extractContainer, extractName } from '../../util/extract.js';
import { sendResponse } from '../../util/sendResponse.js';

export const path = '/graveyard-summary-of-player/:name';
export function handle(document: HTMLElement) {
	const container = extractContainer(document)!;
	const name = extractName(container);

	const h2 = container.querySelector('h2');
	if (!name || h2?.rawText === 'Sorry, but we either:') {
		return sendResponse({}, Code.PlayerNotFound, Message.PlayerNotFound);
	}

	const h3 = container.querySelector('h3');
	if (h3?.rawText === 'No data available yet.') {
		return sendResponse({ name }, Code.PlayerDataMissing, Message.PlayerDataMissing);
	} else if (h3?.rawText.startsWith('The graveyard of')) {
		return sendResponse({ name }, Code.PlayerDataUnavailable, Message.PlayerDataUnavailable);
	}

	const json: RealmeyePlayerGraveyardSummary = {
		name,
		main_achievements: [],
		maxed_stats_by_class: [],
		other_achievements: [],
	};

	const mainAchievementRows = container.querySelector('.table-responsive .table.table-striped.main-achievements')!;
	for (let i = 1; i < mainAchievementRows.childNodes.length; i++) {
		const [, achievement, total, max, average, min] = mainAchievementRows.childNodes[i]!.childNodes.map(
			(c) => c.rawText
		)!;
		json.main_achievements.push({
			achievement: achievement!.replace('&apos;s', "'s").replace(/[0-9]/g, ''),
			total: total ? parseInt(total, 10) : 0,
			max: max ? parseInt(max, 10) : 0,
			average: average ? parseInt(average, 10) : 0,
			min: min ? parseInt(min, 10) : 0,
		});
	}

	const otherAchievementsRows = container.querySelector('.table-responsive .table.table-striped.other-achievements')!;
	for (let i = 1; i < otherAchievementsRows.childNodes.length; i++) {
		const [achievement, total, max, average, min] = otherAchievementsRows.childNodes[i]!.childNodes.map(
			(c) => c.rawText
		)!;

		json.other_achievements.push({
			achievement: achievement!.replace('&apos;s', "'s").replace(/[0-9]/g, ''),
			total: total ? parseInt(total, 10) : 0,
			max: max ? parseInt(max, 10) : 0,
			average: average ? parseInt(average, 10) : 0,
			min: min ? parseInt(min, 10) : 0,
		});
	}

	const classAchievementRows = container.querySelectorAll(
		'.table-responsive .table.table-striped.maxed-stats-by-class tbody tr'
	)!;

	for (const row of classAchievementRows) {
		const classRow: string[] = row.childNodes.map((r) => r.rawText);
		const class_achievement: MaxedStatsByClass = {
			class: classRow[0]!,
			stats: [
				{
					stat_maxed: '0/8',
					count: classRow[1] ? parseInt(classRow[1], 10) : 0,
				},
				{
					stat_maxed: '1/8',
					count: classRow[2] ? parseInt(classRow[2], 10) : 0,
				},
				{
					stat_maxed: '2/8',
					count: classRow[3] ? parseInt(classRow[3], 10) : 0,
				},
				{
					stat_maxed: '3/8',
					count: classRow[4] ? parseInt(classRow[4], 10) : 0,
				},
				{
					stat_maxed: '4/8',
					count: classRow[5] ? parseInt(classRow[5], 10) : 0,
				},
				{
					stat_maxed: '5/8',
					count: classRow[6] ? parseInt(classRow[6], 10) : 0,
				},
				{
					stat_maxed: '6/8',
					count: classRow[7] ? parseInt(classRow[7], 10) : 0,
				},
				{
					stat_maxed: '7/8',
					count: classRow[8] ? parseInt(classRow[8], 10) : 0,
				},
				{
					stat_maxed: '8/8',
					count: classRow[9] ? parseInt(classRow[9], 10) : 0,
				},
			],
			total: 0,
		};
		class_achievement.total = class_achievement.stats.reduce((a, b) => b.count + a, 0);
		json.maxed_stats_by_class.push(class_achievement);
	}

	return sendResponse(json);
}
