export interface RenderPartialMatch {
	partialName: string;
	/** Inclusive start of the quoted partial name in the line. */
	nameStart: number;
	/** Exclusive end of the quoted partial name in the line. */
	nameEnd: number;
}

const PARTIAL_NAME = /[\w./-]+/;

const RENDER_TEMPLATE_OR_FILE =
	/\brender\s*\(?\s*:?\s*(?:template|file)\s*[:=]/;

const EXPLICIT_PARTIAL =
	/render\s*\(?\s*(?:partial\s*[:=]\s*|:\s*partial\s*=>\s*)(['"])(?<name>[\w./-]+)\1/;

const SHORTHAND_RENDER =
	/render\s*\(?\s*(['"])(?<name>[\w./-]+)\1/;

function isCursorInsideName(
	cursor: number,
	quoteStart: number,
	name: string,
): boolean {
	const nameStart = quoteStart + 1;
	const nameEnd = nameStart + name.length;
	return cursor >= nameStart && cursor <= nameEnd;
}

function matchFromRegex(
	line: string,
	cursor: number,
	regex: RegExp,
): RenderPartialMatch | null {
	const match = regex.exec(line);
	if (!match?.groups?.name) {
		return null;
	}
	const name = match.groups.name;
	if (!PARTIAL_NAME.test(name)) {
		return null;
	}
	const full = match[0];
	const quoteIndex = full.indexOf(name) - 1;
	const quoteStart = match.index + quoteIndex;
	if (!isCursorInsideName(cursor, quoteStart, name)) {
		return null;
	}
	return {
		partialName: name,
		nameStart: quoteStart + 1,
		nameEnd: quoteStart + 1 + name.length,
	};
}

/**
 * Detects a Rails `render` partial string at `cursor` on `line`.
 * Returns null when the cursor is outside the partial name or the call is not a partial render.
 */
export function parseRenderCall(
	line: string,
	cursor: number,
): RenderPartialMatch | null {
	if (!/\brender\b/.test(line)) {
		return null;
	}
	if (RENDER_TEMPLATE_OR_FILE.test(line)) {
		return null;
	}

	const explicit = matchFromRegex(line, cursor, EXPLICIT_PARTIAL);
	if (explicit) {
		return explicit;
	}

	if (/\bpartial\b/.test(line) && /render\s*\(?\s*partial/.test(line)) {
		return null;
	}

	return matchFromRegex(line, cursor, SHORTHAND_RENDER);
}