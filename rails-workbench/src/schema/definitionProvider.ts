import * as vscode from 'vscode';
import { findRailsRoot } from '../rails/findRailsRoot';
import { parseColumnAccessAtPosition } from './parseColumnAccess';
import { resolveTable } from './resolveTable';
import type { SchemaStore } from './schemaStore';

const SELECTOR = [
	{ language: 'ruby', scheme: 'file' },
	{ language: 'erb', scheme: 'file' },
	{ language: 'haml', scheme: 'file' },
	{ language: 'slim', scheme: 'file' },
] as const;

export class SchemaDefinitionProvider implements vscode.DefinitionProvider {
	constructor(private readonly store: SchemaStore) {}

	async provideDefinition(
		document: vscode.TextDocument,
		position: vscode.Position,
	): Promise<vscode.LocationLink[] | undefined> {
		const line = document.lineAt(position.line).text;
		const access = parseColumnAccessAtPosition(line, position.character);
		if (!access) {
			return undefined;
		}

		const resolved = await this.store.resolveForDocument(
			document,
			(file) => findRailsRoot(file),
		);
		if (!resolved) {
			return undefined;
		}

		const table = resolveTable(
			resolved.schema,
			access.receiver,
			document.fileName,
		);
		if (!table) {
			return undefined;
		}

		const column = table.columns.get(access.column);
		if (!column) {
			return undefined;
		}

		const targetRange = new vscode.Range(column.line, 0, column.line, 0);
		const originSelectionRange = new vscode.Range(
			position.line,
			access.columnStart,
			position.line,
			access.columnEnd,
		);

		return [
			{
				originSelectionRange,
				targetUri: resolved.schemaUri,
				targetRange,
			},
		];
	}
}

export function registerSchemaDefinitionProvider(
	context: vscode.ExtensionContext,
	store: SchemaStore,
): void {
	const provider = new SchemaDefinitionProvider(store);
	for (const selector of SELECTOR) {
		context.subscriptions.push(
			vscode.languages.registerDefinitionProvider(selector, provider),
		);
	}
}