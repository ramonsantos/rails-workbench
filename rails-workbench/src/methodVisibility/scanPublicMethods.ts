export interface MethodNameRange {
	start: number;
	end: number;
}

export type MethodVisibility = 'public' | 'private' | 'protected';

export interface MethodsByVisibility {
	public: MethodNameRange[];
	private: MethodNameRange[];
	protected: MethodNameRange[];
}

type Visibility = MethodVisibility;

type FrameKind = 'class' | 'module' | 'singleton' | 'def' | 'block';

interface StackFrame {
	kind: FrameKind;
	defaultVisibility: Visibility;
}

const HEX_COLOR = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

export function isValidHexColor(value: string): boolean {
	return HEX_COLOR.test(value);
}

/** Empty or invalid config means no custom color (theme default). */
export function parseOptionalMethodColor(
	configured: string | undefined,
): string | undefined {
	const trimmed = (configured ?? '').trim();
	if (trimmed.length === 0) {
		return undefined;
	}
	return isValidHexColor(trimmed) ? trimmed : undefined;
}

function codePartOfLine(line: string): string {
	let inSingle = false;
	let inDouble = false;
	let escape = false;
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (escape) {
			escape = false;
			continue;
		}
		if (inDouble && c === '\\') {
			escape = true;
			continue;
		}
		if (!inDouble && c === "'") {
			inSingle = !inSingle;
		} else if (!inSingle && c === '"') {
			inDouble = !inDouble;
		} else if (!inSingle && !inDouble && c === '#') {
			return line.slice(0, i);
		}
	}
	return line;
}

function isClassLikeFrame(frame: StackFrame | undefined): boolean {
	return (
		frame?.kind === 'class' ||
		frame?.kind === 'module' ||
		frame?.kind === 'singleton'
	);
}

const VISIBILITY_ONLY =
	/^\s*(private|protected|public)\s*(?:;.*)?\s*$/;

const CLASS_DECLARATION =
	/^\s*class\s+(?:<<\s*[\w.:]+\s*|[\w:]+(?:\s*<[\s\w:]+)?)/;

const MODULE_DECLARATION = /^\s*module\s+[\w:]+/;

const DEF_LINE =
	/^\s*(?:(public|private|protected)\s+)?def\s+(?:(?:self|[\w:]+)\.)?([\w?!=]+)/;

const END_LINE = /^\s*end\b/;

const BLOCK_OPEN =
	/^\s*(?:begin|case|for|if|while|until)\b|\bdo\s*(\|[^|]*\|)?\s*$/;

function lineOffsets(source: string): { line: string; start: number }[] {
	const result: { line: string; start: number }[] = [];
	let start = 0;
	for (let i = 0; i < source.length; i++) {
		if (source[i] === '\n') {
			result.push({ line: source.slice(start, i).replace(/\r$/, ''), start });
			start = i + 1;
		}
	}
	result.push({ line: source.slice(start).replace(/\r$/, ''), start });
	return result;
}

export function emptyMethodsByVisibility(): MethodsByVisibility {
	return { public: [], private: [], protected: [] };
}

export function scanMethodsByVisibility(source: string): MethodsByVisibility {
	const result = emptyMethodsByVisibility();
	const stack: StackFrame[] = [];
	const lines = lineOffsets(source);

	for (const { line, start: lineStart } of lines) {
		const code = codePartOfLine(line);
		const trimmed = code.trim();

		const classParent = stack.at(-1);
		if (isClassLikeFrame(classParent) && VISIBILITY_ONLY.test(code)) {
			const match = VISIBILITY_ONLY.exec(code);
			if (match) {
				classParent!.defaultVisibility = match[1] as Visibility;
			}
		} else if (trimmed.length > 0) {
			const defMatch = DEF_LINE.exec(code);
			if (defMatch) {
				const inlineVis = defMatch[1] as Visibility | undefined;
				const methodName = defMatch[2];
				const parent = stack.at(-1);

				if (isClassLikeFrame(parent)) {
					const effective =
						inlineVis ?? parent!.defaultVisibility;
					const nameOffsetInMatch =
						defMatch[0].lastIndexOf(methodName);
					const nameIndex = defMatch.index + nameOffsetInMatch;
					result[effective].push({
						start: lineStart + nameIndex,
						end: lineStart + nameIndex + methodName.length,
					});
				}

				stack.push({
					kind: 'def',
					defaultVisibility: 'public',
				});
			} else if (CLASS_DECLARATION.test(code)) {
				stack.push({
					kind: code.includes('<<') ? 'singleton' : 'class',
					defaultVisibility: 'public',
				});
			} else if (MODULE_DECLARATION.test(code)) {
				stack.push({
					kind: 'module',
					defaultVisibility: 'public',
				});
			} else if (BLOCK_OPEN.test(code)) {
				stack.push({ kind: 'block', defaultVisibility: 'public' });
			} else if (END_LINE.test(code)) {
				stack.pop();
			}
		}
	}

	return result;
}

/** @deprecated Use scanMethodsByVisibility and read `.public`. */
export function scanPublicMethods(source: string): MethodNameRange[] {
	return scanMethodsByVisibility(source).public;
}