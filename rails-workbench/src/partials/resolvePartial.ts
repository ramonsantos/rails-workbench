import * as path from 'node:path';

export interface PartialResolution {
	directory: string;
	basename: string;
}

export function normalizePartialBasename(segment: string): string {
	const base = path.basename(segment);
	return base.startsWith('_') ? base.slice(1) : base;
}

/**
 * Maps a Rails partial name to the directory and logical basename used in filenames (`_name.ext`).
 */
export function resolvePartialLocation(
	currentFilePath: string,
	railsRoot: string,
	partialName: string,
): PartialResolution {
	const logicalName = normalizePartialBasename(partialName);
	if (partialName.includes('/')) {
		const dir = path.dirname(partialName);
		return {
			directory: path.join(railsRoot, 'app', 'views', dir),
			basename: logicalName,
		};
	}
	return {
		directory: path.dirname(currentFilePath),
		basename: logicalName,
	};
}

export function exactPartialPath(
	directory: string,
	basename: string,
	extension: string,
): string {
	return path.join(directory, `_${basename}.${extension}`);
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns true when `filename` is the exact partial or a locale/variant of the same handler.
 */
export function isMatchingPartialFile(
	filename: string,
	basename: string,
	viewExtensions: readonly string[],
): boolean {
	if (!filename.startsWith(`_${basename}.`)) {
		return false;
	}
	for (const ext of viewExtensions) {
		if (filename === `_${basename}.${ext}`) {
			return true;
		}
		const extPattern = escapeRegex(ext);
		const localePattern = new RegExp(
			`^_${escapeRegex(basename)}\\.[a-z]{2}(?:-[a-zA-Z0-9]+)*\\.${extPattern}$`,
		);
		if (localePattern.test(filename)) {
			return true;
		}
		const dot = ext.indexOf('.');
		if (dot === -1) {
			continue;
		}
		const format = ext.slice(0, dot);
		const handler = ext.slice(dot + 1);
		const variantPattern = new RegExp(
			`^_${escapeRegex(basename)}\\.${escapeRegex(format)}\\+[a-zA-Z0-9_-]+\\.${escapeRegex(handler)}$`,
		);
		if (variantPattern.test(filename)) {
			return true;
		}
		const localeVariantPattern = new RegExp(
			`^_${escapeRegex(basename)}\\.[a-z]{2}(?:-[a-zA-Z0-9]+)*\\.${escapeRegex(format)}\\+[a-zA-Z0-9_-]+\\.${escapeRegex(handler)}$`,
		);
		if (localeVariantPattern.test(filename)) {
			return true;
		}
	}
	return false;
}

export function collectPartialFilenames(
	entries: readonly string[],
	basename: string,
	viewExtensions: readonly string[],
): string[] {
	const matches = entries.filter((name) =>
		isMatchingPartialFile(name, basename, viewExtensions),
	);
	return [...new Set(matches)].sort();
}

export function partialFilePaths(
	directory: string,
	filenames: readonly string[],
): string[] {
	return filenames.map((name) => path.join(directory, name));
}