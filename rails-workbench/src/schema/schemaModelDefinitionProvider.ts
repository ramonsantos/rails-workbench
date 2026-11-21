import * as vscode from 'vscode';
import { findRailsRoot } from '../rails/findRailsRoot';
import { pathExists } from '../rails/pathExists';
import { resolveModelFilePath } from '../models/resolveModelPath';
import { modelClassCandidatesFromTable } from './modelTableName';
import { ModelTableNameIndex } from './modelTableNameIndex';
import { parseCreateTableNameAtPosition } from './parseCreateTableName';
import {
	findClassDeclarationLine,
	parseExplicitTableName,
	parseModelDeclarationAtPosition,
	parsePrimaryModelClass,
} from './parseModelDeclaration';
import { tableNameForModelClass } from './modelTableName';
import { isModelFile } from './resolveTable';
import type { SchemaStore } from './schemaStore';

const SELECTOR = { language: 'ruby', scheme: 'file' } as const;
const SCHEMA_FILE = /[/\\]db[/\\]schema\.rb$/i;

function isSchemaFile(filePath: string): boolean {
	return SCHEMA_FILE.test(filePath);
}

async function readClassTargetLine(
	modelPath: string,
	className: string,
): Promise<number> {
	try {
		const uri = vscode.Uri.file(modelPath);
		const bytes = await vscode.workspace.fs.readFile(uri);
		const source = Buffer.from(bytes).toString('utf8');
		return findClassDeclarationLine(source, className) ?? 0;
	} catch {
		return 0;
	}
}

export class SchemaModelDefinitionProvider implements vscode.DefinitionProvider {
	constructor(
		private readonly store: SchemaStore,
		private readonly modelIndex: ModelTableNameIndex,
	) {}

	async provideDefinition(
		document: vscode.TextDocument,
		position: vscode.Position,
	): Promise<vscode.LocationLink[] | undefined> {
		const filePath = document.fileName;
		const line = document.lineAt(position.line).text;

		if (isSchemaFile(filePath)) {
			return this.fromSchema(document, position, line);
		}

		if (isModelFile(filePath)) {
			return this.fromModel(document, position, line);
		}

		return undefined;
	}

	private async fromSchema(
		document: vscode.TextDocument,
		position: vscode.Position,
		line: string,
	): Promise<vscode.LocationLink[] | undefined> {
		const tableMatch = parseCreateTableNameAtPosition(
			line,
			position.character,
		);
		if (!tableMatch) {
			return undefined;
		}

		const resolved = await this.store.resolveForDocument(
			document,
			(file) => findRailsRoot(file),
		);
		if (!resolved) {
			return undefined;
		}

		const candidates = modelClassCandidatesFromTable(tableMatch.tableName);
		const links: vscode.LocationLink[] = [];
		const origin = new vscode.Range(
			position.line,
			tableMatch.nameStart,
			position.line,
			tableMatch.nameEnd,
		);

		for (const className of candidates) {
			const modelPath = resolveModelFilePath(resolved.railsRoot, className);
			const uri = vscode.Uri.file(modelPath);
			if (await pathExists(uri)) {
				const lineNumber = await readClassTargetLine(modelPath, className);
				links.push({
					originSelectionRange: origin,
					targetUri: uri,
					targetRange: new vscode.Range(lineNumber, 0, lineNumber, 0),
				});
			}
		}

		if (links.length > 0) {
			return links;
		}

		const indexed = await this.modelIndex.modelPathForTable(
			resolved.railsRoot,
			tableMatch.tableName,
		);
		if (!indexed) {
			return undefined;
		}

		const uri = vscode.Uri.file(indexed);
		const source = Buffer.from(
			await vscode.workspace.fs.readFile(uri),
		).toString('utf8');
		const className = parsePrimaryModelClass(source);
		const lineNumber = className
			? (findClassDeclarationLine(source, className) ?? 0)
			: 0;

		return [
			{
				originSelectionRange: origin,
				targetUri: uri,
				targetRange: new vscode.Range(lineNumber, 0, lineNumber, 0),
			},
		];
	}

	private async fromModel(
		document: vscode.TextDocument,
		position: vscode.Position,
		line: string,
	): Promise<vscode.LocationLink[] | undefined> {
		const classMatch = parseModelDeclarationAtPosition(
			line,
			position.character,
		);
		if (!classMatch) {
			return undefined;
		}

		const resolved = await this.store.resolveForDocument(
			document,
			(file) => findRailsRoot(file),
		);
		if (!resolved) {
			return undefined;
		}

		const explicit = parseExplicitTableName(document.getText());
		const tableName =
			explicit ?? tableNameForModelClass(classMatch.className);
		const table = resolved.schema.tables.get(tableName);
		if (!table) {
			return undefined;
		}

		return [
			{
				originSelectionRange: new vscode.Range(
					position.line,
					classMatch.nameStart,
					position.line,
					classMatch.nameEnd,
				),
				targetUri: resolved.schemaUri,
				targetRange: new vscode.Range(
					table.createTableLine,
					0,
					table.createTableLine,
					0,
				),
			},
		];
	}
}

export function registerSchemaModelDefinitionProvider(
	context: vscode.ExtensionContext,
	store: SchemaStore,
): ModelTableNameIndex {
	const modelIndex = new ModelTableNameIndex();
	const provider = new SchemaModelDefinitionProvider(store, modelIndex);
	context.subscriptions.push(
		modelIndex,
		vscode.languages.registerDefinitionProvider(SELECTOR, provider),
	);
	return modelIndex;
}