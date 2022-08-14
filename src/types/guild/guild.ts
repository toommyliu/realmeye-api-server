import type { EquipmentSlot } from '../player/player';

export interface RealmeyeGuild {
	name: string;
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
