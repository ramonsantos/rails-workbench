import * as vscode from 'vscode';

export async function actionDefinitionPosition(
	controllerUri: vscode.Uri,
	action: string,
): Promise<vscode.Position> {
	const document = await vscode.workspace.openTextDocument(controllerUri);
	const pattern = new RegExp(`^\\s*def\\s+${escapeRegex(action)}\\b`);
	for (let line = 0; line < document.lineCount; line++) {
		if (pattern.test(document.lineAt(line).text)) {
			return new vscode.Position(line, 0);
		}
	}
	return new vscode.Position(0, 0);
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}