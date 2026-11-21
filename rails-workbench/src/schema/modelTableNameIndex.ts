import * as path from 'node:path';
import * as vscode from 'vscode';
import { pathExists } from '../rails/pathExists';
import {
	parseExplicitTableName,
	parsePrimaryModelClass,
} from './parseModelDeclaration';
import { tableNameForModelClass } from './modelTableName';

export class ModelTableNameIndex implements vscode.Disposable {
	private readonly byRoot = new Map<string, Map<string, string>>();
	private readonly watchKeys = new Set<string>();
	private readonly disposables: vscode.Disposable[] = [];

	async modelPathForTable(
		railsRoot: string,
		tableName: string,
	): Promise<string | undefined> {
		await this.ensureIndex(railsRoot);
		return this.byRoot.get(railsRoot)?.get(tableName);
	}

	private async ensureIndex(railsRoot: string): Promise<void> {
		if (!this.byRoot.has(railsRoot)) {
			await this.rebuild(railsRoot);
			this.watchModels(railsRoot);
		}
	}

	private watchModels(railsRoot: string): void {
		if (this.watchKeys.has(railsRoot)) {
			return;
		}
		this.watchKeys.add(railsRoot);
		const watcher = vscode.workspace.createFileSystemWatcher(
			new vscode.RelativePattern(
				vscode.Uri.file(railsRoot),
				'app/models/**/*.rb',
			),
		);
		const schedule = (): void => {
			void this.rebuild(railsRoot);
		};
		watcher.onDidChange(schedule);
		watcher.onDidCreate(schedule);
		watcher.onDidDelete(schedule);
		this.disposables.push(watcher);
	}

	private async rebuild(railsRoot: string): Promise<void> {
		const pattern = new vscode.RelativePattern(
			vscode.Uri.file(railsRoot),
			'app/models/**/*.rb',
		);
		const uris = await vscode.workspace.findFiles(
			pattern,
			undefined,
			500,
		);
		const tableToPath = new Map<string, string>();

		for (const uri of uris) {
			try {
				const bytes = await vscode.workspace.fs.readFile(uri);
				const source = Buffer.from(bytes).toString('utf8');
				const className = parsePrimaryModelClass(source);
				if (!className) {
					continue;
				}
				const table =
					parseExplicitTableName(source) ??
					tableNameForModelClass(className);
				if (!tableToPath.has(table)) {
					tableToPath.set(table, uri.fsPath);
				}
			} catch {
				// skip unreadable files
			}
		}

		this.byRoot.set(railsRoot, tableToPath);
	}

	dispose(): void {
		for (const d of this.disposables) {
			d.dispose();
		}
		this.disposables.length = 0;
		this.byRoot.clear();
		this.watchKeys.clear();
	}
}