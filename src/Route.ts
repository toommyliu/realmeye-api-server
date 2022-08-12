import type { Request, Response } from 'polka';

export interface Route {
	path: string;
	handle: (req: Request, res: Response) => Promise<unknown>;
}
