import * as vscode from 'vscode';
import { registerPartialDefinitionProvider } from './partials/definitionProvider';
import { registerRoutesFeature } from './routes/registerRoutes';

export function activate(context: vscode.ExtensionContext): void {
	registerPartialDefinitionProvider(context);
	registerRoutesFeature(context);
}

export function deactivate(): void {}