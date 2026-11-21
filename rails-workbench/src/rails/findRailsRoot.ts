import * as path from 'node:path';
import * as vscode from 'vscode';
import { environmentRbPath, railsRootCandidates } from '../partials/railsRoot';
import { pathExists } from './pathExists';

export async function findRailsRoot(startPath: string): Promise<string | null> {
	const startDir = path.extname(startPath)
		? path.dirname(startPath)
		: startPath;
	for (const candidate of railsRootCandidates(startDir)) {
		const envUri = vscode.Uri.file(environmentRbPath(candidate));
		if (await pathExists(envUri)) {
			return candidate;
		}
	}
	return null;
}

export async function findRailsRootFromDocument(
	document: vscode.TextDocument,
): Promise<string | null> {
	return findRailsRoot(document.fileName);
}