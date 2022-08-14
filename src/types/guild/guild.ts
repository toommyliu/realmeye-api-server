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
