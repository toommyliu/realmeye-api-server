import { request } from 'undici';

const USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

export const fetch = (url: string) => request(url, { headers: { 'User-Agent': USER_AGENT } });
