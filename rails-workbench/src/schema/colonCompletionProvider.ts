import * as vscode from 'vscode';
import { findRailsRoot } from '../rails/findRailsRoot';
import { buildColumnCompletions } from './buildColumnCompletions';
import { tableize } from './inflect';
import { isModelFile, tableNameForModelFile } from './resolveTable';
import type { SchemaStore } from './schemaStore';

const HUMAN_ATTRIBUTE = /(\w+)\.human_attribute_name[\s(]:$/;
const VALIDATES = /validates\s+:$/;

export class SchemaColonCompletionProvider
	implements vscode.CompletionItemProvider
{
	constructor(private readonly store: SchemaStore) {}

	async provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
	): Promise<vscode.CompletionItem[] | undefined> {
		const linePrefix = document
			.getText(new vscode.Range(new vscode.Position(position.line, 0), position))
			.trimEnd();

		const resolved = await this.store.resolveForDocument(
			document,
			(file) => findRailsRoot(file),
		);
		if (!resolved) {
			return undefined;
		}

		if (isModelFile(document.fileName) && VALIDATES.test(linePrefix)) {
			const tableName = tableNameForModelFile(
				document.fileName,
				resolved.schema,
			);
			const table = tableName
				? resolved.schema.tables.get(tableName)
				: undefined;
			return table ? buildColumnCompletions(table) : undefined;
		}

		const humanMatch = HUMAN_ATTRIBUTE.exec(linePrefix);
		if (humanMatch) {
			const table = resolved.schema.tables.get(tableize(humanMatch[1]));
			return table ? buildColumnCompletions(table) : undefined;
		}

		return undefined;
	}
}