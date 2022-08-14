export interface RealmeyePlayer {
	name: string;

	description?: string[];

	fame?: number;
	exp?: number;
	rank?: number;
	guild?: string;
	guild_rank?: string;
	account_fame?: number;

	created?: string;
	first_seen?: string;
	last_seen?: string;

	character_count?: number;
	skin_count?: number;
	exaltation_count?: number;
	pet_count?: number;
	offer_count?: number;

	characters?: RealmeyeCharacter[];
}

export interface RealmeyeCharacter {
	class?: string;
	level?: number;
	class_quests_completed?: string;
	fame?: number;
	exp?: number;
	place?: number;
	equipment?: EquipmentSlot[];
	last_seen?: string;
	server?: string;
	stats?: string;
	skin?: {
		skinId: number;
		clothingDyeId: number;
		accessoryDyeId: number;
	};
}

export interface RealmeyePlayerExaltations {
	current_exaltations?: number;
	exaltations?: ClassExaltation[];
	name: string;
	percentage?: number;
	remaining_exaltations?: number;
	url: string;
}

export interface ClassExaltation {
	attack: number;
	class: string;
	defense: number;
	dexterity: number;
	health: number;
	mana: number;
	speed: number;
	total: number;
	vitality: number;
	wisdom: number;
}

export interface RealmeyePlayerGraveyardSummary {
	main_achievements: AchievementRow[];
	other_achievements: AchievementRow[];
	maxed_stats_by_class: MaxedStatsByClass[];
}

export interface AchievementRow {
	achievement: string;
	total: number;
	max: number;
	average: number;
	min: number;
}

export interface MaxedStatsByClass {
	class: string;
	stats: {
		stat_maxed: MaxedStat;
		count: number;
	}[];
	total: number;
}

export type MaxedStat = '0/8' | '1/8' | '2/8' | '3/8' | '4/8' | '5/8' | '6/8' | '7/8' | '8/8';

export interface RealmeyePlayerNameHistory {
	name: string;
	names: {
		name: string;
		from: string;
		to: string;
	}[];
}

export interface RealmeyePlayerPetYard {
	name: string;
	pets: {
		name: string;
		rarity: string;
		family: string;
		place: number;
		abilities: {
			ability: string;
			level: number;
			maxed: boolean;
			unlocked: boolean;
		}[];
		max_level: number;
	}[];
}

export interface EquipmentSlot {
	item: string;
	tier: string;
	type: EquipmentSlotType;
}

export const enum EquipmentSlotType {
	Weapon,
	Ability,
	Armor,
	Ring,
	Backpack,
}
