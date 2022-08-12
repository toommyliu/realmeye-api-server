import type { Response } from 'polka';
import type { Code, Message } from '../constants.js';

export function sendResponse(res: Response, resp?: Record<string, any>, code?: Code, message?: Message) {
	const json: Record<string, any> = {};
	json.code ??= code;
	json.message ??= message;

	if (resp) {
		Object.assign(json, resp);
	}

	return res.end(JSON.stringify(json));
}
