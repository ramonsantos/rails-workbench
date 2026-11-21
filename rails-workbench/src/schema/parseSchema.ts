import { classify } from './inflect';
import type { ColumnRecord, ParsedSchema, TableRecord } from './schemaTypes';

const CREATE_TABLE =
	/^\s*create_table\s+(?:"([a-zA-Z0-9_]+)"|:([a-zA-Z0-9_]+))/;
const END_TABLE = /^\s*end\s*$/;
const COLUMN_LINE =
	/^\s*t\.([a-zA-Z0-9_]+)\s+(?:"([a-zA-Z0-9_]+)"|:([a-zA-Z0-9_]+))/;
const COMMENT = /,\s+comment:\s+"([^"]*)"/;

const NON_COLUMN_TYPES = new Set(['index']);

function parseComment(line: string): string | undefined {
	return COMMENT.exec(line)?.[1];
}

/**
 * Parses the contents of `db/schema.rb` into tables and columns.
 */
export function parseSchema(source: string): ParsedSchema {
	const tables = new Map<string, TableRecord>();
	const lines = source.split(/\r?\n/);

	let current: {
		tableName: string;
		className: string;
		createTableLine: number;
		columns: Map<string, ColumnRecord>;
	} | null = null;

	for (let line = 0; line < lines.length; line++) {
		const text = lines[line];
		const createMatch = CREATE_TABLE.exec(text);
		if (createMatch) {
			const tableName = createMatch[1] ?? createMatch[2];
			current = {
				tableName,
				className: classify(tableName),
				createTableLine: line,
				columns: new Map(),
			};
			continue;
		}

		if (current && END_TABLE.test(text)) {
			tables.set(current.tableName, {
				tableName: current.tableName,
				className: current.className,
				createTableLine: current.createTableLine,
				columns: current.columns,
			});
			current = null;
			continue;
		}

		if (!current) {
			continue;
		}

		const columnMatch = COLUMN_LINE.exec(text);
		if (!columnMatch) {
			continue;
		}

		const columnType = columnMatch[1];
		if (NON_COLUMN_TYPES.has(columnType)) {
			continue;
		}

		const name = columnMatch[2] ?? columnMatch[3];
		const record: ColumnRecord = {
			name,
			columnType,
			comment: parseComment(text),
			line,
			lineText: text.trim(),
		};
		current.columns.set(name, record);
	}

	return { tables };
}