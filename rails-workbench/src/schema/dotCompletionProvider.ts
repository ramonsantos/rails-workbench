import * as vscode from 'vscode';
import { findRailsRoot } from '../rails/findRailsRoot';
import { buildColumnCompletions } from './buildColumnCompletions';
import { tableize } from './inflect';
import { isModelFile, tableNameForModelFile } from './resolveTable';
import type { SchemaStore } from './schemaStore';

const LINE_PREFIX = /(?:(\w+)\.|\W\w*)$/;

export class SchemaDotCompletionProvider
	implements vscode.CompletionItemProvider
{
	constructor(private readonly store: SchemaStore) {}

	async provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
	): Promise<vscode.CompletionItem[] | undefined> {
		const linePrefix = document.getText(
			new vscode.Range(new vscode.Position(position.line, 0), position),
		);
		const match = LINE_PREFIX.exec(linePrefix);
		if (!match) {
			return undefined;
		}

		const resolved = await this.store.resolveForDocument(
			document,
			(file) => findRailsRoot(file),
		);
		if (!resolved) {
			return undefined;
		}

		const receiver = match[1];
		let table;
		if (!receiver || receiver === 'self') {
			const tableName = tableNameForModelFile(
				document.fileName,
				resolved.schema,
			);
			table = tableName
				? resolved.schema.tables.get(tableName)
				: undefined;
		} else {
			table = resolved.schema.tables.get(tableize(receiver));
		}

		if (!table) {
			return undefined;
		}

		if (!receiver && !isModelFile(document.fileName)) {
			return undefined;
		}

		return buildColumnCompletions(table);
	}
}