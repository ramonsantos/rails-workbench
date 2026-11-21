import * as vscode from 'vscode';
import { findRailsRoot } from '../rails/findRailsRoot';
import { buildUrlHelperSnippet } from './buildSnippet';
import type { RouteIndexManager } from './routeIndexManager';

export function registerInsertUrlHelperCommand(
	context: vscode.ExtensionContext,
	manager: RouteIndexManager,
): void {
	context.subscriptions.push(
		vscode.commands.registerCommand('rails-workbench.routes.insert', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}

			const resolved = await manager.resolveForDocument(
				editor.document,
				(file) => findRailsRoot(file),
			);
			if (!resolved || resolved.index.size === 0) {
				void vscode.window.showWarningMessage(
					'Rails Workbench: no routes loaded for this project.',
				);
				return;
			}

			const items = [...resolved.index.entries()].map(([helper, route]) => {
				const snippet = buildUrlHelperSnippet(helper, route.params);
				return {
					label: `${helper}_path`,
					description: snippet.value,
					snippet,
				};
			});

			const picked = await vscode.window.showQuickPick(items, {
				placeHolder: 'Insert URL helper',
			});
			if (!picked) {
				return;
			}

			await editor.insertSnippet(picked.snippet);
		}),
	);
}