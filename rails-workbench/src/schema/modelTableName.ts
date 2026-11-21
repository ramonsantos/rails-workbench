import { classify } from './inflect';

function segmentToSnake(segment: string): string {
	return segment
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
		.replace(/([a-z\d])([A-Z])/g, '$1_$2')
		.toLowerCase();
}

/** `User` → `users`; `Admin::User` → `admin_users` (does not use tableize). */
export function tableNameForModelClass(className: string): string {
	const segments = className.split('::').map(segmentToSnake);
	const last = segments[segments.length - 1];
	segments[segments.length - 1] = pluralizeWord(last);
	return segments.join('_');
}

function pluralizeWord(word: string): string {
	if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) {
		return `${word.slice(0, -1)}ies`;
	}
	if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z')) {
		return `${word}es`;
	}
	return `${word}s`;
}

function singularizeTableSegment(word: string): string {
	if (word.endsWith('ies')) {
		return `${word.slice(0, -3)}y`;
	}
	if (word.endsWith('ees')) {
		return word.slice(0, -1);
	}
	if (/(?:ches|shes|sses|xes|zes)$/.test(word)) {
		return word.slice(0, -2);
	}
	if (word.endsWith('s') && !word.endsWith('ss')) {
		return word.slice(0, -1);
	}
	if (word.endsWith('es') && word.length > 2) {
		return word.slice(0, -2);
	}
	return word;
}

function capitalizeSegment(part: string): string {
	return part
		.split('_')
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join('');
}

/**
 * Model class names to try for a schema table (flat classify + namespace splits).
 */
export function modelClassCandidatesFromTable(tableName: string): string[] {
	const seen = new Set<string>();
	const result: string[] = [];

	const add = (className: string): void => {
		if (!seen.has(className)) {
			seen.add(className);
			result.push(className);
		}
	};

	add(classify(tableName));

	const parts = tableName.split('_');
	for (let i = 1; i < parts.length; i++) {
		const nsParts = parts.slice(0, i);
		const tablePart = parts.slice(i).join('_');
		const singular = singularizeTableSegment(tablePart);
		const nsClass = nsParts
			.map(capitalizeSegment)
			.join('::');
		const modelClass = `${nsClass}::${capitalizeSegment(singular)}`;
		add(modelClass);
	}

	return result;
}