import * as path from 'node:path';
import * as vscode from 'vscode';
import { findRailsRoot } from '../rails/findRailsRoot';
import { pathExists } from '../rails/pathExists';
import { pickLatestMigration } from './pickLatestMigration';

export async function findRailsRootForWorkbench(): Promise<string | null> {
	const active = vscode.window.activeTextEditor;
	if (active) {
		const root = await findRailsRoot(active.document.fileName);
		if (root) {
			return root;
		}
	}
	for (const folder of vscode.workspace.workspaceFolders ?? []) {
		const root = await findRailsRoot(folder.uri.fsPath);
		if (root) {
			return root;
		}
	}
	return null;
}

export async function resolveLatestMigrationPath(
	railsRoot: string,
): Promise<string | undefined> {
	const migrateDir = path.join(railsRoot, 'db', 'migrate');
	const uri = vscode.Uri.file(migrateDir);
	try {
		const entries = await vscode.workspace.fs.readDirectory(uri);
		const names = entries
			.filter(([, kind]) => kind === vscode.FileType.File)
			.map(([name]) => name);
		const latest = pickLatestMigration(names);
		if (!latest) {
			return undefined;
		}
		return path.join(migrateDir, latest);
	} catch {
		return undefined;
	}
}

export async function openLatestMigration(): Promise<void> {
	const railsRoot = await findRailsRootForWorkbench();
	if (!railsRoot) {
		void vscode.window.showErrorMessage(
			'Rails Workbench: could not find a Rails application root.',
		);
		return;
	}

	const filePath = await resolveLatestMigrationPath(railsRoot);
	if (!filePath) {
		void vscode.window.showErrorMessage(
			'Rails Workbench: no migration files in db/migrate.',
		);
		return;
	}

	const uri = vscode.Uri.file(filePath);
	if (!(await pathExists(uri))) {
		void vscode.window.showErrorMessage(
			'Rails Workbench: latest migration file no longer exists.',
		);
		return;
	}

	const doc = await vscode.workspace.openTextDocument(uri);
	await vscode.window.showTextDocument(doc, { preview: false });
}