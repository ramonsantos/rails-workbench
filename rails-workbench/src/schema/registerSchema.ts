import * as vscode from 'vscode';
import { SchemaColonCompletionProvider } from './colonCompletionProvider';
import { SchemaDotCompletionProvider } from './dotCompletionProvider';
import { registerSchemaDefinitionProvider } from './definitionProvider';
import { registerSchemaCommands } from './schemaCommands';
import { SchemaStore } from './schemaStore';

const SELECTOR = [
	{ language: 'ruby', scheme: 'file' },
	{ language: 'erb', scheme: 'file' },
	{ language: 'haml', scheme: 'file' },
	{ language: 'slim', scheme: 'file' },
] as const;

export function registerSchemaFeature(context: vscode.ExtensionContext): void {
	const store = new SchemaStore();
	context.subscriptions.push(store);

	registerSchemaDefinitionProvider(context, store);
	registerSchemaCommands(context, store);

	const dot = new SchemaDotCompletionProvider(store);
	const colon = new SchemaColonCompletionProvider(store);
	for (const selector of SELECTOR) {
		context.subscriptions.push(
			vscode.languages.registerCompletionItemProvider(selector, dot, '.'),
			vscode.languages.registerCompletionItemProvider(selector, colon, ':'),
		);
	}
}