import * as vscode from 'vscode';
import { findRailsRoot } from '../rails/findRailsRoot';
import { pathExists } from '../rails/pathExists';
import { parseAssociationAtPosition } from './parseAssociation';
import { resolveModelFilePath } from './resolveModelPath';
import { isModelFile } from '../schema/resolveTable';

const SELECTOR = { language: 'ruby', scheme: 'file' } as const;

export class AssociationDefinitionProvider implements vscode.DefinitionProvider {
	async provideDefinition(
		document: vscode.TextDocument,
		position: vscode.Position,
	): Promise<vscode.LocationLink[] | undefined> {
		if (!isModelFile(document.fileName)) {
			return undefined;
		}

		const line = document.lineAt(position.line).text;
		const previousLine =
			position.line > 0
				? document.lineAt(position.line - 1).text
				: undefined;
		const nextLine =
			position.line + 1 < document.lineCount
				? document.lineAt(position.line + 1).text
				: undefined;

		const match = parseAssociationAtPosition(line, position.character, {
			previousLine,
			nextLine,
		});
		if (!match) {
			return undefined;
		}

		const railsRoot = await findRailsRoot(document.fileName);
		if (!railsRoot) {
			return undefined;
		}

		const targetPath = resolveModelFilePath(railsRoot, match.modelClass);
		const targetUri = vscode.Uri.file(targetPath);
		if (!(await pathExists(targetUri))) {
			return undefined;
		}

		return [
			{
				originSelectionRange: new vscode.Range(
					position.line,
					match.nameStart,
					position.line,
					match.nameEnd,
				),
				targetUri,
				targetRange: new vscode.Range(0, 0, 0, 0),
			},
		];
	}
}

export function registerAssociationDefinitionProvider(
	context: vscode.ExtensionContext,
): void {
	const provider = new AssociationDefinitionProvider();
	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(SELECTOR, provider),
	);
}