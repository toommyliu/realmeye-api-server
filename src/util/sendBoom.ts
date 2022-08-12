// https://github.com/ChatSift/AutoModerator/blob/7285bc332922c774b3decd290656130ed6ef3c01/services/api/src/util/index.ts
import type { Boom } from '@hapi/boom';
import type { Response } from 'polka';

export function sendBoom(e: Boom, res: Response) {
	res.statusCode = e.output.statusCode;
	for (const [header, value] of Object.entries(e.output.headers)) {
		res.setHeader(header, value!);
	}

	return res.end(JSON.stringify(e.output.payload));
}
