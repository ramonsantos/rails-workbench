const CLASS_DECLARATION =
	/^\s*class\s+([A-Z][\w:]*)(?:\s*<|\s*$|#)/;

export interface ModelClassMatch {
	className: string;
	nameStart: number;
	nameEnd: number;
}

export function parseModelDeclarationAtPosition(
	line: string,
	cursor: number,
): ModelClassMatch | null {
	const match = CLASS_DECLARATION.exec(line);
	if (!match) {
		return null;
	}
	const className = match[1];
	if (className === 'ApplicationRecord' || className === 'ActiveRecord::Base') {
		return null;
	}
	const nameStart = match.index + match[0].indexOf(className);
	const nameEnd = nameStart + className.length;
	if (cursor < nameStart || cursor > nameEnd) {
		return null;
	}
	return { className, nameStart, nameEnd };
}

const EXPLICIT_TABLE_NAME =
	/self\.table_name\s*=\s*(['"])([a-zA-Z0-9_]+)\1/;

export function parseExplicitTableName(source: string): string | undefined {
	return EXPLICIT_TABLE_NAME.exec(source)?.[2];
}

const CLASS_LINE = /^\s*class\s+([A-Z][\w:]*)/gm;

export function findClassDeclarationLine(
	source: string,
	className: string,
): number | undefined {
	const lines = source.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const match = CLASS_DECLARATION.exec(lines[i]);
		if (match?.[1] === className) {
			return i;
		}
	}
	return undefined;
}

export function parsePrimaryModelClass(source: string): string | undefined {
	for (const match of source.matchAll(CLASS_LINE)) {
		const name = match[1];
		if (name !== 'ApplicationRecord' && name !== 'ActiveRecord::Base') {
			return name;
		}
	}
	return undefined;
}