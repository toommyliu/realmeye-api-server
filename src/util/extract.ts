import type { HTMLElement } from 'node-html-parser';

export function extractContainer(document: HTMLElement) {
	return document.querySelector('.container .row .col-md-12');
}

export function extractName(container: HTMLElement) {
	return container.querySelector('.entity-name')?.text;
}
