import type { Code, Message } from '../constants.js';

export function sendResponse(resp?: Record<string, any>, code?: Code, message?: Message) {
	const json: Record<string, any> = {};
	json.code ??= code;
	json.message ??= message;

	if (resp) {
		Object.assign(json, resp);
	}

	return JSON.stringify(json);
}
