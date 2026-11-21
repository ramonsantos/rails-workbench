import * as path from 'node:path';
import * as vscode from 'vscode';
import { findRailsRoot } from '../rails/findRailsRoot';
import type { SchemaStore } from './schemaStore';

export function registerSchemaCommands(
	context: vscode.ExtensionContext,
	store: SchemaStore,
): void {
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'rails-workbench.schema.open',
			async (tableName?: string) => {
				const editor = vscode.window.activeTextEditor;
				const railsRoot = editor
					? await findRailsRoot(editor.document.fileName)
					: null;
				if (!railsRoot) {
					void vscode.window.showWarningMessage(
						'Rails Workbench: open a file inside a Rails app.',
					);
					return;
				}

				let tableNames = store.getTableNames(railsRoot);
				if (tableNames.length === 0 && editor) {
					await store.resolveForDocument(
						editor.document,
						(file) => findRailsRoot(file),
					);
					tableNames = store.getTableNames(railsRoot);
				}

				const picked =
					typeof tableName === 'string'
						? tableName
						: await vscode.window.showQuickPick(tableNames, {
								placeHolder: 'Open table in schema.rb',
							});
				if (!picked) {
					return;
				}

				if (editor) {
					const resolved = await store.resolveForDocument(
						editor.document,
						(file) => findRailsRoot(file),
					);
					const table = resolved?.schema.tables.get(picked);
					if (!table) {
						void vscode.window.showWarningMessage(
							`Rails Workbench: unknown table "${picked}".`,
						);
						return;
					}

					const schemaUri = vscode.Uri.file(
						path.join(railsRoot, 'db', 'schema.rb'),
					);
					const doc = await vscode.workspace.openTextDocument(schemaUri);
					const textEditor = await vscode.window.showTextDocument(doc);
					const position = new vscode.Position(table.createTableLine, 0);
					textEditor.selection = new vscode.Selection(position, position);
					textEditor.revealRange(
						textEditor.selection,
						vscode.TextEditorRevealType.InCenter,
					);
				}
			},
		),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'rails-workbench.schema.insert',
			async () => {
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					return;
				}

				const resolved = await store.resolveForDocument(
					editor.document,
					(file) => findRailsRoot(file),
				);
				if (!resolved) {
					void vscode.window.showWarningMessage(
						'Rails Workbench: no schema.rb found for this project.',
					);
					return;
				}

				const tableName = await vscode.window.showQuickPick(
					[...resolved.schema.tables.keys()].sort(),
					{ placeHolder: 'Select a table' },
				);
				if (!tableName) {
					return;
				}

				const table = resolved.schema.tables.get(tableName);
				if (!table) {
					return;
				}

				const columnItems = [...table.columns.values()].map((column) => ({
					label: column.name,
					description: column.lineText,
				}));

				const columnPick = await vscode.window.showQuickPick(columnItems, {
					placeHolder: 'Select a column',
				});
				if (!columnPick) {
					return;
				}

				await editor.edit((edit) => {
					if (editor.selection.isEmpty) {
						edit.insert(editor.selection.active, columnPick.label);
					} else {
						edit.replace(editor.selection, columnPick.label);
					}
				});
			},
		),
	);
}