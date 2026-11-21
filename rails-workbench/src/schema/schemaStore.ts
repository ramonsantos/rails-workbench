import * as path from 'node:path';
import * as vscode from 'vscode';
import { pathExists } from '../rails/pathExists';
import { environmentRbPath } from '../partials/railsRoot';
import { parseSchema } from './parseSchema';
import type { ParsedSchema } from './schemaTypes';

const SCHEMA_GLOB = '**/db/schema.rb';
const DEBOUNCE_MS = 500;

export interface ResolvedSchema {
	railsRoot: string;
	schema: ParsedSchema;
	schemaUri: vscode.Uri;
}

export class SchemaStore implements vscode.Disposable {
	private readonly schemas = new Map<string, ParsedSchema>();
	private readonly schemaUris = new Map<string, vscode.Uri>();
	private readonly watchedRoots = new Set<string>();
	private readonly disposables: vscode.Disposable[] = [];

	constructor() {
		void this.initialize();
	}

	private async initialize(): Promise<void> {
		const roots = await this.discoverSchemaRoots();
		for (const { root, uri } of roots) {
			await this.refresh(root, uri);
			this.watchSchema(root);
		}
	}

	private async discoverSchemaRoots(): Promise<
		Array<{ root: string; uri: vscode.Uri }>
	> {
		const files = await vscode.workspace.findFiles(
			SCHEMA_GLOB,
			'**/node_modules/**',
		);
		const seen = new Set<string>();
		const result: Array<{ root: string; uri: vscode.Uri }> = [];
		for (const uri of files) {
			const schemaPath = uri.fsPath;
			const root = path.dirname(path.dirname(schemaPath));
			if (seen.has(root)) {
				continue;
			}
			if (await pathExists(vscode.Uri.file(environmentRbPath(root)))) {
				seen.add(root);
				result.push({ root, uri });
			}
		}
		return result;
	}

	private watchSchema(railsRoot: string): void {
		if (this.watchedRoots.has(railsRoot)) {
			return;
		}
		this.watchedRoots.add(railsRoot);
		const uri = vscode.Uri.file(path.join(railsRoot, 'db', 'schema.rb'));
		const watcher = vscode.workspace.createFileSystemWatcher(
			new vscode.RelativePattern(vscode.Uri.file(railsRoot), 'db/schema.rb'),
		);
		let timer: ReturnType<typeof setTimeout> | undefined;
		const schedule = (): void => {
			if (timer) {
				clearTimeout(timer);
			}
			timer = setTimeout(() => void this.refresh(railsRoot, uri), DEBOUNCE_MS);
		};
		watcher.onDidChange(schedule);
		watcher.onDidCreate(schedule);
		this.disposables.push(watcher, {
			dispose: () => {
				if (timer) {
					clearTimeout(timer);
				}
			},
		});
	}

	async refresh(railsRoot: string, uri: vscode.Uri): Promise<void> {
		try {
			const bytes = await vscode.workspace.fs.readFile(uri);
			const source = Buffer.from(bytes).toString('utf8');
			const parsed = parseSchema(source);
			this.schemas.set(railsRoot, parsed);
			this.schemaUris.set(railsRoot, uri);
		} catch {
			this.schemas.delete(railsRoot);
		}
	}

	async resolveForDocument(
		document: vscode.TextDocument,
		findRoot: (file: string) => Promise<string | null>,
	): Promise<ResolvedSchema | null> {
		const railsRoot = await findRoot(document.fileName);
		if (!railsRoot) {
			return null;
		}

		if (!this.schemas.has(railsRoot)) {
			const schemaPath = path.join(railsRoot, 'db', 'schema.rb');
			const uri = vscode.Uri.file(schemaPath);
			if (!(await pathExists(uri))) {
				return null;
			}
			await this.refresh(railsRoot, uri);
		}

		const schema = this.schemas.get(railsRoot);
		const schemaUri = this.schemaUris.get(railsRoot);
		if (!schema || !schemaUri) {
			return null;
		}

		return { railsRoot, schema, schemaUri };
	}

	getTableNames(railsRoot: string): string[] {
		const schema = this.schemas.get(railsRoot);
		return schema ? [...schema.tables.keys()].sort() : [];
	}

	dispose(): void {
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
		this.disposables.length = 0;
		this.schemas.clear();
		this.schemaUris.clear();
		this.watchedRoots.clear();
	}
}