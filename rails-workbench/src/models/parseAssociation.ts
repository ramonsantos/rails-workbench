import { inferModelClassFromSymbol } from './inferModelClass';

const ASSOCIATION_MACRO =
	/\b(belongs_to|has_one|has_many|has_and_belongs_to_many)\b/;

const POLYMORPHIC = /\bpolymorphic:\s*true\b/;

const ASSOCIATION_HEAD =
	/\b(?:belongs_to|has_one|has_many|has_and_belongs_to_many)\s*(?:\(\s*)?:(\w+)/;

export interface AssociationNavigation {
	modelClass: string;
	nameStart: number;
	nameEnd: number;
}

export interface AssociationParseContext {
	/** Line immediately above the cursor line. */
	previousLine?: string;
	/** Line immediately below when options continue on the next line. */
	nextLine?: string;
}

type SpanInCall = {
	modelClass: string;
	start: number;
	end: number;
};

function associationCallText(line: string, nextLine: string): string {
	const trimmed = line.trimEnd();
	if (/\)\s*$/.test(trimmed) && !trimmed.endsWith(',')) {
		return line;
	}
	return `${line} ${nextLine.trim()}`;
}

function lineLeadingSpaces(line: string): number {
	return line.length - line.trimStart().length;
}

function extractClassName(callText: string): string | undefined {
	const quoted = /class_name:\s*(['"])([^'"]+)\1/.exec(callText);
	if (quoted) {
		return quoted[2];
	}
	const constant = /class_name:\s*([A-Z][\w:]*)\b/.exec(callText);
	return constant?.[1];
}

function extractSourceType(callText: string): string | undefined {
	const quoted = /source_type:\s*(['"])([^'"]+)\1/.exec(callText);
	if (quoted) {
		return quoted[2];
	}
	const constant = /source_type:\s*([A-Z][\w:]*)\b/.exec(callText);
	return constant?.[1];
}

function forEachOptionSymbol(
	callText: string,
	option: 'through' | 'source',
	callback: (symbol: string, start: number, end: number) => void,
): void {
	const pattern = new RegExp(`${option}:\\s*:(\\w+)`, 'g');
	for (const match of callText.matchAll(pattern)) {
		const symbol = match[1];
		const colonIndex = match.index + match[0].indexOf(`:${symbol}`);
		callback(symbol, colonIndex, colonIndex + 1 + symbol.length);
	}
}

function forEachClassOption(
	callText: string,
	option: 'class_name' | 'source_type',
	callback: (className: string, start: number, end: number) => void,
): void {
	const quotedRe = new RegExp(`${option}:\\s*(['"])([^'"]+)\\1`, 'g');
	const quotedRanges: Array<{ start: number; end: number }> = [];
	for (const match of callText.matchAll(quotedRe)) {
		const className = match[2];
		const valueStart = match.index + match[0].lastIndexOf(className);
		const valueEnd = valueStart + className.length;
		quotedRanges.push({ start: valueStart, end: valueEnd });
		callback(className, valueStart, valueEnd);
	}

	const constantRe = new RegExp(`${option}:\\s*([A-Z][\\w:]*)\\b`, 'g');
	for (const match of callText.matchAll(constantRe)) {
		const className = match[1];
		const valueStart = match.index + match[0].indexOf(className);
		if (
			quotedRanges.some(
				(range) => valueStart >= range.start && valueStart < range.end,
			)
		) {
			continue;
		}
		callback(className, valueStart, valueStart + className.length);
	}
}

function navigableSpansInCall(callText: string): SpanInCall[] {
	const spans: SpanInCall[] = [];
	const classNameOverride = extractClassName(callText);
	const sourceType = extractSourceType(callText);
	const polymorphic = POLYMORPHIC.test(callText);

	const head = ASSOCIATION_HEAD.exec(callText);
	if (head) {
		const symbol = head[1];
		const colonIndex = head.index + head[0].indexOf(`:${symbol}`);
		const assocStart = colonIndex;
		const assocEnd = assocStart + 1 + symbol.length;
		if (!polymorphic) {
			const modelClass =
				classNameOverride ?? inferModelClassFromSymbol(symbol);
			spans.push({ modelClass, start: assocStart, end: assocEnd });
		}
	}

	forEachClassOption(callText, 'class_name', (className, start, end) => {
		spans.push({ modelClass: className, start, end });
	});

	forEachOptionSymbol(callText, 'through', (symbol, start, end) => {
		spans.push({
			modelClass: inferModelClassFromSymbol(symbol),
			start,
			end,
		});
	});

	forEachOptionSymbol(callText, 'source', (symbol, start, end) => {
		const modelClass =
			sourceType ?? inferModelClassFromSymbol(symbol);
		spans.push({ modelClass, start, end });
	});

	forEachClassOption(callText, 'source_type', (className, start, end) => {
		spans.push({ modelClass: className, start, end });
	});

	return spans;
}

/**
 * Resolves go-to-definition for association macros on the cursor line.
 * Returns undefined spans elsewhere on the line so Ruby LSP can handle other tokens.
 */
export function parseAssociationAtPosition(
	line: string,
	cursor: number,
	context?: AssociationParseContext,
): AssociationNavigation | null {
	let callText = line;
	let callTextOffset = 0;

	if (
		context?.previousLine &&
		ASSOCIATION_MACRO.test(context.previousLine) &&
		!ASSOCIATION_MACRO.test(line)
	) {
		const trimmed = line.trimStart();
		callText = `${context.previousLine} ${trimmed}`;
		callTextOffset = context.previousLine.length + 1 - lineLeadingSpaces(line);
	} else if (ASSOCIATION_MACRO.test(line) && context?.nextLine) {
		callText = associationCallText(line, context.nextLine);
	}

	if (!ASSOCIATION_MACRO.test(callText)) {
		return null;
	}

	const cursorInCall = cursor + callTextOffset;
	const spans = navigableSpansInCall(callText);
	for (const span of spans) {
		if (cursorInCall < span.start || cursorInCall > span.end) {
			continue;
		}
		return {
			modelClass: span.modelClass,
			nameStart: span.start - callTextOffset,
			nameEnd: span.end - callTextOffset,
		};
	}

	return null;
}