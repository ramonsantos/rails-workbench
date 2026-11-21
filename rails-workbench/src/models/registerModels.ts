import type * as vscode from 'vscode';
import { registerAssociationDefinitionProvider } from './associationDefinitionProvider';

export function registerModelsFeature(context: vscode.ExtensionContext): void {
	registerAssociationDefinitionProvider(context);
}