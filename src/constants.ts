import { send } from 'httpie';

export const userAgent =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36';
export const baseUrl = 'https://www.realmeye.com';

export function get(url: string) {
	const req = send('get', baseUrl + url, {
		headers: {
			'user-agent': userAgent,
		},
	});

	return req;
}

export const enum Code {
	PlayerNotFound = 'player_not_found',
	PlayerDataMissing = 'player_data_missing',
	PlayerDataUnavailable = 'player_data_unavailable',

	GuildNotFound = 'guild_not_found',
}

export const enum Message {
	PlayerNotFound = 'The requested player could not be found.',
	PlayerDataMissing = 'The requested player data for this resource is missing.',
	PlayerDataUnavailable = 'The requested player data for this resource is unavailable.',

	GuildNotFound = 'The requested guild could not be found.',
}
