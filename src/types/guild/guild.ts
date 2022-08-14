import type { EquipmentSlot } from '../player/player';

export interface RealmeyeGuild {
	name: string;
	description: string[];
	members: {
		name: string;
		star: string;
		guild_rank: string;
		fame: number;
		exp: number;
		rank: number;
		chars: number;
		last_seen: string;
		server: string;
		avg_fame: number;
		avg_exp: number;
	}[];
	member_count: number;
	character_count: number;
	fame: number;
	exp: number;
	most_active_on: string;
}

export interface RealmeyeGuildTopCharacters {
	name: string;
	characters: RealmeyeGuildTopCharacter[];
}

export interface RealmeyeGuildTopCharacter {
	name: string;
	fame: number;
	class: string;
	exp: number;
	equipment: EquipmentSlot[];
	stats: string;
	last_seen: string;
	server: string;
}

export interface RealmeyeGuildTopPets {
	name: string;
	pets: {
		place: number;
		name: string;
		rarity: string;
		family: string;
		abilities: {
			ability: string;
			level: number;
			maxed: boolean;
			unlocked: boolean;
		}[];
		max_level: number;
		owner: string;
	}[];
}
