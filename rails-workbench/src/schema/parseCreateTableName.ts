const CREATE_TABLE =
	/^\s*create_table\s+(?:"([a-zA-Z0-9_]+)"|:([a-zA-Z0-9_]+))/;

export interface CreateTableNameMatch {
	tableName: string;
	nameStart: number;
	nameEnd: number;
}

/**
 * Returns the table name token when the cursor is on `create_table "users"` / `create_table :users`.
 */
export function parseCreateTableNameAtPosition(
	line: string,
	cursor: number,
): CreateTableNameMatch | null {
	const match = CREATE_TABLE.exec(line);
	if (!match) {
		return null;
	}
	const tableName = match[1] ?? match[2];
	const quoted = Boolean(match[1]);
	const tokenPrefix = quoted ? '"' : ':';
	const tokenStart =
		match.index + match[0].indexOf(`${tokenPrefix}${tableName}`);
	const nameStart = tokenStart + 1;
	const nameEnd = nameStart + tableName.length;
	if (cursor < nameStart || cursor > nameEnd) {
		return null;
	}
	return { tableName, nameStart, nameEnd };
}