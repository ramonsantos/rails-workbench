import * as path from 'node:path';
import * as vscode from 'vscode';
import { findRailsRoot } from '../rails/findRailsRoot';
import { buildUrlHelperSnippet } from './buildSnippet';
import type { RouteIndexManager } from './routeIndexManager';

const ROUTE_CONTEXT =
	/(?:link_to|redirect_to|button_to|\Wvisit[(\s]|(?:url|path):\s+|(?:url|path)\s*=)/;

function controllerMatchScore(relativePath: string, controller: string): number {
	const normalized = relativePath
		.replace(/^app\/(?:controllers|views)\//, '')
		.replace(/\.[^/]+$/, '');
	const fileParts = normalized.split(path.sep);
	const controllerParts = controller.split('/');
	let score = 0;
	for (let i = 0; i < fileParts.length && i < controllerParts.length; i++) {
		if (fileParts[i] === controllerParts[i]) {
			score += 1;
		} else {
			break;
		}
	}
	return score;
}

export class RouteCompletionProvider implements vscode.CompletionItemProvider {
	constructor(private readonly manager: RouteIndexManager) {}

	async provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
	): Promise<vscode.CompletionItem[] | null> {
		const linePrefix = document.getText(
			new vscode.Range(new vscode.Position(position.line, 0), position),
		);
		if (!ROUTE_CONTEXT.test(linePrefix)) {
			return null;
		}

		const resolved = await this.manager.resolveForDocument(
			document,
			(file) => findRailsRoot(file),
		);
		if (!resolved || resolved.index.size === 0) {
			return null;
		}

		const relativePath = vscode.workspace.asRelativePath(document.uri);
		const itemsWithScore = [...resolved.index.entries()].map(
			([helper, route]) => {
				const item = new vscode.CompletionItem(
					`${helper}_path`,
					vscode.CompletionItemKind.Method,
				);
				item.detail = [...route.actions]
					.map((action) => `${route.controller}#${action}`)
					.join(', ');
				item.insertText = buildUrlHelperSnippet(helper, route.params);
				const score = controllerMatchScore(relativePath, route.controller);
				return { item, score };
			},
		);

		const maxScore = Math.max(...itemsWithScore.map(({ score }) => score));
		const best = itemsWithScore.find(({ score }) => score === maxScore);
		if (best) {
			best.item.preselect = true;
		}

		return itemsWithScore.map(({ item }) => item);
	}
}

const COMPLETION_LANGUAGES = [
	{ language: 'ruby', scheme: 'file' },
	{ language: 'erb', scheme: 'file' },
	{ language: 'haml', scheme: 'file' },
	{ language: 'slim', scheme: 'file' },
] as const;

export function registerRouteCompletionProvider(
	context: vscode.ExtensionContext,
	manager: RouteIndexManager,
): void {
	const provider = new RouteCompletionProvider(manager);
	for (const selector of COMPLETION_LANGUAGES) {
		context.subscriptions.push(
			vscode.languages.registerCompletionItemProvider(selector, provider),
		);
	}
}