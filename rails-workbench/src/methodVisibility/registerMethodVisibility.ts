import * as vscode from 'vscode';
import {
	resolvePublicMethodColor,
	scanPublicMethods,
} from './scanPublicMethods';

const DEBOUNCE_MS = 150;

function readConfig(): { enabled: boolean; color: string } {
	const config = vscode.workspace.getConfiguration('rails-workbench');
	return {
		enabled: config.get<boolean>('methodVisibility.enabled', true),
		color: resolvePublicMethodColor(
			config.get<string>('methodVisibility.publicMethodColor', '#3DDC97') ??
				'#3DDC97',
		),
	};
}

export function registerMethodVisibility(
	context: vscode.ExtensionContext,
): void {
	let decorationType: vscode.TextEditorDecorationType | undefined;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	const editorRanges = new Map<string, vscode.Range[]>();

	const disposeDecoration = (): void => {
		decorationType?.dispose();
		decorationType = undefined;
	};

	const ensureDecoration = (color: string): vscode.TextEditorDecorationType => {
		if (decorationType) {
			return decorationType;
		}
		decorationType = vscode.window.createTextEditorDecorationType({
			color,
		});
		context.subscriptions.push(decorationType);
		return decorationType;
	};

	const rangesForDocument = (
		document: vscode.TextDocument,
	): vscode.Range[] => {
		if (document.languageId !== 'ruby' || !readConfig().enabled) {
			return [];
		}
		return scanPublicMethods(document.getText()).map(
			(r) =>
				new vscode.Range(
					document.positionAt(r.start),
					document.positionAt(r.end),
				),
		);
	};

	const applyToEditor = (editor: vscode.TextEditor): void => {
		const { enabled, color } = readConfig();
		const key = editor.document.uri.toString();

		if (editor.document.languageId !== 'ruby' || !enabled) {
			editor.setDecorations(
				ensureDecoration(color),
				[],
			);
			editorRanges.delete(key);
			return;
		}

		const cached = editorRanges.get(key);
		const ranges =
			cached ??
			(() => {
				const computed = rangesForDocument(editor.document);
				editorRanges.set(key, computed);
				return computed;
			})();

		editor.setDecorations(ensureDecoration(color), ranges);
	};

	const invalidateDocument = (uri: vscode.Uri): void => {
		editorRanges.delete(uri.toString());
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
			e.affectsConfiguration('rails-workbench.methodVisibility.enabled') ||
			e.affectsConfiguration(
				'rails-workbench.methodVisibility.publicMethodColor',
			)
		) {
			disposeDecoration();
			editorRanges.clear();
			refreshAll();
		}
	};

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
			editorRanges.delete(doc.uri.toString());
		}),
		vscode.workspace.onDidChangeConfiguration(onConfigChange),
	);

	for (const editor of vscode.window.visibleTextEditors) {
		applyToEditor(editor);
	}
}