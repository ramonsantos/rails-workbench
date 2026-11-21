const URL_HELPER = /\w+_(?:path|url)/;

export interface UrlHelperMatch {
	helper: string;
	start: number;
	end: number;
}

export function parseUrlHelperAtPosition(
	line: string,
	character: number,
): UrlHelperMatch | null {
	const regex = new RegExp(URL_HELPER.source, 'g');
	let match: RegExpExecArray | null;
	while ((match = regex.exec(line)) !== null) {
		const start = match.index;
		const end = start + match[0].length;
		if (character >= start && character <= end) {
			const full = match[0];
			const helper = full.replace(/_(?:path|url)$/, '');
			return { helper, start, end };
		}
	}
	return null;
}