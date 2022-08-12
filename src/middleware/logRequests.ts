import type { NextHandler, Request, Response } from 'polka';
import { logger } from '../logger.js';

export const logRequests = () => (req: Request, res: Response, next: NextHandler) => {
	logger.info({
		method: req.method,
		status: res.statusCode,
		route: req.originalUrl,
		body: req.body as Record<string, unknown>,
		params: req.params,
		query: req.query,
	});

	return next();
};
