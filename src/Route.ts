import type { HTMLElement } from 'node-html-parser';

export interface Route {
	path: string;
	handle: (document: HTMLElement) => Promise<unknown>;
}
