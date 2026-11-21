import * as vscode from 'vscode';
import { findRailsRoot } from '../rails/findRailsRoot';
import { pathExists } from '../rails/pathExists';
import { actionDefinitionPosition } from './actionLocation';
import { controllerRbPath } from './controllerPath';
import { parseUrlHelperAtPosition } from './parseUrlHelper';
import type { RouteIndexManager } from './routeIndexManager';

const ROUTE_LANGUAGES = [
	{ language: 'ruby', scheme: 'file' },
	{ language: 'erb', scheme: 'file' },
	{ language: 'haml', scheme: 'file' },
	{ language: 'slim', scheme: 'file' },
] as const;

export class RouteDefinitionProvider implements vscode.DefinitionProvider {
	constructor(private readonly manager: RouteIndexManager) {}

	async provideDefinition(
		document: vscode.TextDocument,
		position: vscode.Position,
	): Promise<vscode.LocationLink[] | undefined> {
		const line = document.lineAt(position.line).text;
		const helperMatch = parseUrlHelperAtPosition(line, position.character);
		if (!helperMatch) {
			return undefined;
		}

		const resolved = await this.manager.resolveForDocument(
			document,
			(file) => findRailsRoot(file),
		);
		if (!resolved) {
			return undefined;
		}

		const route = resolved.index.get(helperMatch.helper);
		if (!route) {
			return undefined;
		}

		const controllerPath = controllerRbPath(resolved.railsRoot, route.controller);
		const controllerUri = vscode.Uri.file(controllerPath);
		if (!(await pathExists(controllerUri))) {
			return undefined;
		}

		const originSelectionRange = new vscode.Range(
			position.line,
			helperMatch.start,
			position.line,
			helperMatch.end,
		);

		const links: vscode.LocationLink[] = [];
		for (const action of route.actions) {
			const actionPosition = await actionDefinitionPosition(
				controllerUri,
				action,
			);
			links.push({
				originSelectionRange,
				targetUri: controllerUri,
				targetRange: new vscode.Range(actionPosition, actionPosition),
			});
		}

		return links.length > 0 ? links : undefined;
	}
}

export function registerRouteDefinitionProvider(
	context: vscode.ExtensionContext,
	manager: RouteIndexManager,
): void {
	const provider = new RouteDefinitionProvider(manager);
	for (const selector of ROUTE_LANGUAGES) {
		context.subscriptions.push(
			vscode.languages.registerDefinitionProvider(selector, provider),
		);
	}
}