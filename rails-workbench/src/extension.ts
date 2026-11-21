import * as vscode from 'vscode';
import { registerActivityBarHomeView } from './activityBar/homeView';
import { registerModelsFeature } from './models/registerModels';
import { registerPartialDefinitionProvider } from './partials/definitionProvider';
import { registerRoutesFeature } from './routes/registerRoutes';
import { registerSchemaFeature } from './schema/registerSchema';

export function activate(context: vscode.ExtensionContext): void {
	registerActivityBarHomeView(context);
	registerPartialDefinitionProvider(context);
	registerRoutesFeature(context);
	registerSchemaFeature(context);
	registerModelsFeature(context);
}

export function deactivate(): void {}