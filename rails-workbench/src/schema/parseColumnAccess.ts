const COLUMN_ACCESS = /(?:(\w+)\.)?(\w+)/g;

export interface ColumnAccessMatch {
	receiver?: string;
	column: string;
	/** Start of column name (or full token if no receiver). */
	columnStart: number;
	columnEnd: number;
}

export function parseColumnAccessAtPosition(
	line: string,
	character: number,
): ColumnAccessMatch | null {
	let match: RegExpExecArray | null;
	const regex = new RegExp(COLUMN_ACCESS.source, 'g');
	while ((match = regex.exec(line)) !== null) {
		const receiver = match[1];
		const column = match[2];
		const columnStart = receiver
			? match.index + receiver.length + 1
			: match.index;
		const columnEnd = columnStart + column.length;
		if (character >= columnStart && character <= columnEnd) {
			return {
				receiver,
				column,
				columnStart,
				columnEnd,
			};
		}
	}
	return null;
}