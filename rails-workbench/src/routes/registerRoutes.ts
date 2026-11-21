import type * as vscode from 'vscode';
import { registerRouteCompletionProvider } from './completionProvider';
import { registerRouteDefinitionProvider } from './definitionProvider';
import { registerInsertUrlHelperCommand } from './insertUrlHelper';
import { RouteIndexManager } from './routeIndexManager';

export function registerRoutesFeature(context: vscode.ExtensionContext): void {
	const manager = new RouteIndexManager();
	context.subscriptions.push(manager);
	registerRouteDefinitionProvider(context, manager);
	registerRouteCompletionProvider(context, manager);
	registerInsertUrlHelperCommand(context, manager);
}