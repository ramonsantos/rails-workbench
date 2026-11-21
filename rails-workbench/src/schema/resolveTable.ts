import * as path from 'node:path';
import { tableize } from './inflect';
import type { ParsedSchema, TableRecord } from './schemaTypes';

const MODEL_FILE = /[/\\]app[/\\]models[/\\].+\.rb$/i;

export function isModelFile(filePath: string): boolean {
	return MODEL_FILE.test(filePath);
}

export function tableNameForModelFile(
	filePath: string,
	schema: ParsedSchema,
): string | undefined {
	if (!isModelFile(filePath)) {
		return undefined;
	}
	const base = path.basename(filePath, '.rb');
	const tableName = tableize(base);
	return schema.tables.has(tableName) ? tableName : undefined;
}

export function resolveTable(
	schema: ParsedSchema,
	receiver: string | undefined,
	filePath: string,
): TableRecord | undefined {
	if (receiver && receiver !== 'self') {
		const tableName = tableize(receiver);
		return schema.tables.get(tableName);
	}
	const fromFile = tableNameForModelFile(filePath, schema);
	if (!fromFile) {
		return undefined;
	}
	return schema.tables.get(fromFile);
}