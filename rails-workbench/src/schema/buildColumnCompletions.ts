import * as vscode from 'vscode';
import type { TableRecord } from './schemaTypes';

export function buildColumnCompletions(
	table: TableRecord,
): vscode.CompletionItem[] {
	return [...table.columns.values()].map((column) => {
		const item = new vscode.CompletionItem(
			column.name,
			vscode.CompletionItemKind.Field,
		);
		item.detail = `${table.className} — ${column.columnType}`;
		const markdown = ['```ruby', column.lineText, '```'].join('\n');
		item.documentation = new vscode.MarkdownString(markdown);
		return item;
	});
}