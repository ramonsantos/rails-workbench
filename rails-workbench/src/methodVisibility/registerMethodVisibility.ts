import * as vscode from 'vscode';
import {
	MethodVisibility,
	MethodsByVisibility,
	parseOptionalMethodColor,
	scanMethodsByVisibility,
} from './scanPublicMethods';

const DEBOUNCE_MS = 150;

const VISIBILITIES: MethodVisibility[] = ['public', 'private', 'protected'];

interface VisibilityColors {
	public?: string;
	private?: string;
	protected?: string;
}

function readColors(): VisibilityColors {
	const config = vscode.workspace.getConfiguration('rails-workbench');
	return {
		public: parseOptionalMethodColor(
			config.get<string>('methodVisibility.publicMethodColor'),
		),
		private: parseOptionalMethodColor(
			config.get<string>('methodVisibility.privateMethodColor'),
		),
		protected: parseOptionalMethodColor(
			config.get<string>('methodVisibility.protectedMethodColor'),
		),
	};
}

function anyColorConfigured(colors: VisibilityColors): boolean {
	return Boolean(colors.public ?? colors.private ?? colors.protected);
}

export function registerMethodVisibility(
	context: vscode.ExtensionContext,
): void {
	const decorationByVisibility = new Map<
		MethodVisibility,
		vscode.TextEditorDecorationType
	>();
	const decorationColor = new Map<MethodVisibility, string>();
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	const editorCache = new Map<string, MethodsByVisibility>();

	const disposeAllDecorations = (): void => {
		for (const dt of decorationByVisibility.values()) {
			dt.dispose();
		}
		decorationByVisibility.clear();
		decorationColor.clear();
	};

	const decorationForVisibility = (
		visibility: MethodVisibility,
		color: string,
	): vscode.TextEditorDecorationType => {
		const previousColor = decorationColor.get(visibility);
		if (previousColor !== color) {
			decorationByVisibility.get(visibility)?.dispose();
			const dt = vscode.window.createTextEditorDecorationType({ color });
			decorationByVisibility.set(visibility, dt);
			decorationColor.set(visibility, color);
		}
		return decorationByVisibility.get(visibility)!;
	};

	const toRanges = (
		document: vscode.TextDocument,
		ranges: MethodsByVisibility['public'],
	): vscode.Range[] =>
		ranges.map(
			(r) =>
				new vscode.Range(
					document.positionAt(r.start),
					document.positionAt(r.end),
				),
		);

	const applyToEditor = (editor: vscode.TextEditor): void => {
		const colors = readColors();
		const key = editor.document.uri.toString();

		for (const vis of VISIBILITIES) {
			const dt = decorationByVisibility.get(vis);
			if (dt) {
				editor.setDecorations(dt, []);
			}
		}

		if (editor.document.languageId !== 'ruby' || !anyColorConfigured(colors)) {
			editorCache.delete(key);
			return;
		}

		const cached = editorCache.get(key);
		const byVisibility =
			cached ??
			(() => {
				const computed = scanMethodsByVisibility(editor.document.getText());
				editorCache.set(key, computed);
				return computed;
			})();

		for (const vis of VISIBILITIES) {
			const color = colors[vis];
			if (!color) {
				continue;
			}
			editor.setDecorations(
				decorationForVisibility(vis, color),
				toRanges(editor.document, byVisibility[vis]),
			);
		}
	};

	const invalidateDocument = (uri: vscode.Uri): void => {
		editorCache.delete(uri.toString());
	};

	const refreshAll = (): void => {
		for (const editor of vscode.window.visibleTextEditors) {
			if (editor.document.uri.scheme === 'file') {
				invalidateDocument(editor.document.uri);
				applyToEditor(editor);
			}
		}
	};

	const scheduleRefresh = (document: vscode.TextDocument): void => {
		if (document.languageId !== 'ruby') {
			return;
		}
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		debounceTimer = setTimeout(() => {
			debounceTimer = undefined;
			invalidateDocument(document.uri);
			for (const editor of vscode.window.visibleTextEditors) {
				if (editor.document.uri.toString() === document.uri.toString()) {
					applyToEditor(editor);
				}
			}
		}, DEBOUNCE_MS);
	};

	const onConfigChange = (e: vscode.ConfigurationChangeEvent): void => {
		if (
			e.affectsConfiguration('rails-workbench.methodVisibility.publicMethodColor') ||
			e.affectsConfiguration('rails-workbench.methodVisibility.privateMethodColor') ||
			e.affectsConfiguration('rails-workbench.methodVisibility.protectedMethodColor')
		) {
			disposeAllDecorations();
			editorCache.clear();
			refreshAll();
		}
	};

	context.subscriptions.push({
		dispose: disposeAllDecorations,
	});

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			if (editor) {
				applyToEditor(editor);
			}
		}),
		vscode.window.onDidChangeVisibleTextEditors((editors) => {
			for (const editor of editors) {
				applyToEditor(editor);
			}
		}),
		vscode.workspace.onDidChangeTextDocument((e) => {
			scheduleRefresh(e.document);
		}),
		vscode.workspace.onDidOpenTextDocument((doc) => {
			if (doc.languageId === 'ruby') {
				invalidateDocument(doc.uri);
			}
		}),
		vscode.workspace.onDidCloseTextDocument((doc) => {
			editorCache.delete(doc.uri.toString());
		}),
		vscode.workspace.onDidChangeConfiguration(onConfigChange),
	);

	for (const editor of vscode.window.visibleTextEditors) {
		applyToEditor(editor);
	}
}