import * as vscode from 'vscode';
import { registerPartialDefinitionProvider } from './partials/definitionProvider';

export function activate(context: vscode.ExtensionContext): void {
	registerPartialDefinitionProvider(context);
}

export function deactivate(): void {}