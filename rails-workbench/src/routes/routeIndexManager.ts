import * as path from 'node:path';
import * as vscode from 'vscode';
import { pathExists } from '../rails/pathExists';
import { environmentRbPath } from '../partials/railsRoot';
import { loadRoutesWithProgress } from './loadRoutes';
import type { RouteIndex, RouteRecord } from './routeTypes';

const ROUTES_GLOB = '**/config/routes.rb';
const DEBOUNCE_MS = 1000;

export class RouteIndexManager implements vscode.Disposable {
	private readonly indices = new Map<string, RouteIndex>();
	private readonly loadedSuccessfully = new Set<string>();
	private readonly loadGeneration = new Map<string, number>();
	private readonly watchedRoots = new Set<string>();
	private readonly disposables: vscode.Disposable[] = [];
	private lastErrorShownAt = 0;

	constructor() {
		void this.initialize();
		this.disposables.push(
			vscode.workspace.onDidChangeConfiguration((event) => {
				if (
					event.affectsConfiguration('rails-workbench.routes.command') ||
					event.affectsConfiguration('rails-workbench.routes.workingDirectory')
				) {
					void this.reloadAll();
				}
			}),
		);
	}

	private async initialize(): Promise<void> {
		const roots = await this.discoverRailsRoots();
		for (const root of roots) {
			this.watchRoutesFiles(root);
			void this.refresh(root);
		}
	}

	private async discoverRailsRoots(): Promise<string[]> {
		const files = await vscode.workspace.findFiles(ROUTES_GLOB, '**/node_modules/**');
		const roots = new Set<string>();
		for (const uri of files) {
			const configDir = path.dirname(uri.fsPath);
			const root = path.dirname(configDir);
			if (await pathExists(vscode.Uri.file(environmentRbPath(root)))) {
				roots.add(root);
			}
		}
		return [...roots];
	}

	private watchRoutesFiles(railsRoot: string): void {
		if (this.watchedRoots.has(railsRoot)) {
			return;
		}
		this.watchedRoots.add(railsRoot);
		const base = vscode.Uri.file(railsRoot);
		const patterns = ['config/routes.rb', 'config/routes/**/*.rb'];
		for (const pattern of patterns) {
			const watcher = vscode.workspace.createFileSystemWatcher(
				new vscode.RelativePattern(base, pattern),
			);
			let timer: ReturnType<typeof setTimeout> | undefined;
			const schedule = (): void => {
				if (timer) {
					clearTimeout(timer);
				}
				timer = setTimeout(() => void this.refresh(railsRoot), DEBOUNCE_MS);
			};
			watcher.onDidChange(schedule);
			watcher.onDidCreate(schedule);
			watcher.onDidDelete(schedule);
			this.disposables.push(watcher, {
				dispose: () => {
					if (timer) {
						clearTimeout(timer);
					}
				},
			});
		}
	}

	async refresh(railsRoot: string): Promise<void> {
		const generation = (this.loadGeneration.get(railsRoot) ?? 0) + 1;
		this.loadGeneration.set(railsRoot, generation);
		const result = await loadRoutesWithProgress(railsRoot);
		if (this.loadGeneration.get(railsRoot) !== generation) {
			return;
		}
		if (result.index.size > 0) {
			this.indices.set(railsRoot, result.index);
			this.loadedSuccessfully.add(railsRoot);
			return;
		}

		this.loadedSuccessfully.delete(railsRoot);
		this.indices.delete(railsRoot);
		if (result.stderr) {
			this.showLoadErrorOnce(result.stderr);
		}
	}

	private showLoadErrorOnce(message: string): void {
		const now = Date.now();
		if (now - this.lastErrorShownAt < 10_000) {
			return;
		}
		this.lastErrorShownAt = now;
		void vscode.window.showErrorMessage(
			`Rails Workbench: failed to load routes (${message.trim()})`,
		);
	}

	async reloadAll(): Promise<void> {
		const roots =
			this.indices.size > 0
				? [...this.indices.keys()]
				: await this.discoverRailsRoots();
		await Promise.all(roots.map((root) => this.refresh(root)));
	}

	getIndex(railsRoot: string): RouteIndex | undefined {
		return this.indices.get(railsRoot);
	}

	getRoute(railsRoot: string, helper: string): RouteRecord | undefined {
		return this.indices.get(railsRoot)?.get(helper);
	}

	getAllForRoot(railsRoot: string): ReadonlyArray<[string, RouteRecord]> {
		const index = this.indices.get(railsRoot);
		return index ? [...index.entries()] : [];
	}

	async resolveForDocument(
		document: vscode.TextDocument,
		findRoot: (file: string) => Promise<string | null>,
	): Promise<{ railsRoot: string; index: RouteIndex } | null> {
		const railsRoot = await findRoot(document.fileName);
		if (!railsRoot) {
			return null;
		}
		if (!this.loadedSuccessfully.has(railsRoot)) {
			this.watchRoutesFiles(railsRoot);
			await this.refresh(railsRoot);
		}
		return {
			railsRoot,
			index: this.indices.get(railsRoot) ?? new Map(),
		};
	}

	dispose(): void {
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
		this.disposables.length = 0;
		this.indices.clear();
		this.watchedRoots.clear();
	}
}
