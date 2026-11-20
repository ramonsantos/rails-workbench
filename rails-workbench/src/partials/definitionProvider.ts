import * as path from 'node:path';
import * as vscode from 'vscode';
import { parseRenderCall } from './parseRenderCall';
import { environmentRbPath, railsRootCandidates } from './railsRoot';
import {
	collectPartialFilenames,
	partialFilePaths,
	resolvePartialLocation,
} from './resolvePartial';

const VIEW_LANGUAGES = [
	{ language: 'erb', scheme: 'file' },
	{ language: 'haml', scheme: 'file' },
	{ language: 'slim', scheme: 'file' },
] as const;

const CONFIG_KEY = 'partials.viewFileExtensions';

async function pathExists(uri: vscode.Uri): Promise<boolean> {
	try {
		await vscode.workspace.fs.stat(uri);
		return true;
	} catch {
		return false;
	}
}

async function findRailsRoot(documentPath: string): Promise<string | null> {
	for (const candidate of railsRootCandidates(path.dirname(documentPath))) {
		const envUri = vscode.Uri.file(environmentRbPath(candidate));
		if (await pathExists(envUri)) {
			return candidate;
		}
	}
	return null;
}

function viewFileExtensions(): string[] {
	return vscode.workspace
		.getConfiguration('rails-workbench')
		.get<string[]>(CONFIG_KEY, ['html.erb', 'html.haml', 'html.slim']);
}

async function listDirectoryFiles(directory: string): Promise<string[]> {
	const uri = vscode.Uri.file(directory);
	try {
		const entries = await vscode.workspace.fs.readDirectory(uri);
		return entries
			.filter(([, fileType]) => fileType === vscode.FileType.File)
			.map(([name]) => name);
	} catch {
		return [];
	}
}

async function resolvePartialTargetPaths(
	currentFilePath: string,
	railsRoot: string,
	partialName: string,
): Promise<string[]> {
	const extensions = viewFileExtensions();
	const { directory, basename } = resolvePartialLocation(
		currentFilePath,
		railsRoot,
		partialName,
	);

	const fromDir = collectPartialFilenames(
		await listDirectoryFiles(directory),
		basename,
		extensions,
	);

	if (fromDir.length > 0) {
		const existing: string[] = [];
		for (const filePath of partialFilePaths(directory, fromDir)) {
			if (await pathExists(vscode.Uri.file(filePath))) {
				existing.push(filePath);
			}
		}
		return existing;
	}

	const exact = extensions.map((ext) =>
		path.join(directory, `_${basename}.${ext}`),
	);
	const found = await Promise.all(
		exact.map(async (filePath) =>
			(await pathExists(vscode.Uri.file(filePath))) ? filePath : null,
		),
	);
	return found.filter((p): p is string => p !== null);
}

export class PartialDefinitionProvider implements vscode.DefinitionProvider {
	async provideDefinition(
		document: vscode.TextDocument,
		position: vscode.Position,
	): Promise<vscode.LocationLink[] | undefined> {
		const line = document.lineAt(position.line).text;
		const match = parseRenderCall(line, position.character);
		if (!match) {
			return undefined;
		}

		const railsRoot = await findRailsRoot(document.fileName);
		if (!railsRoot) {
			return undefined;
		}

		const targets = await resolvePartialTargetPaths(
			document.fileName,
			railsRoot,
			match.partialName,
		);
		if (targets.length === 0) {
			return undefined;
		}

		const originSelectionRange = new vscode.Range(
			position.line,
			match.nameStart,
			position.line,
			match.nameEnd,
		);
		const targetRange = new vscode.Range(0, 0, 0, 0);

		const links: vscode.LocationLink[] = targets.map((targetPath) => ({
			originSelectionRange,
			targetUri: vscode.Uri.file(targetPath),
			targetRange,
		}));
		return links;
	}
}

export function registerPartialDefinitionProvider(
	context: vscode.ExtensionContext,
): void {
	const provider = new PartialDefinitionProvider();
	for (const selector of VIEW_LANGUAGES) {
		context.subscriptions.push(
			vscode.languages.registerDefinitionProvider(selector, provider),
		);
	}
}