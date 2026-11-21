export interface ColumnRecord {
	name: string;
	columnType: string;
	comment?: string;
	/** Zero-based line index in schema.rb */
	line: number;
	lineText: string;
}

export interface TableRecord {
	tableName: string;
	className: string;
	/** Line of create_table */
	createTableLine: number;
	columns: ReadonlyMap<string, ColumnRecord>;
}

export interface ParsedSchema {
	tables: ReadonlyMap<string, TableRecord>;
}