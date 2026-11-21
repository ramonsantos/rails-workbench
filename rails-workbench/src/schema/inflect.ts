const IRREGULAR_PLURALS: Readonly<Record<string, string>> = {
	person: 'people',
	child: 'children',
	man: 'men',
	woman: 'women',
	mouse: 'mice',
	foot: 'feet',
	tooth: 'teeth',
	leaf: 'leaves',
};

const IRREGULAR_SINGULARS: Readonly<Record<string, string>> =
	Object.fromEntries(
		Object.entries(IRREGULAR_PLURALS).map(([singular, plural]) => [
			plural,
			singular,
		]),
	);

function underscore(value: string): string {
	return value
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
		.replace(/([a-z\d])([A-Z])/g, '$1_$2')
		.replace(/-/g, '_')
		.toLowerCase();
}

function pluralize(word: string): string {
	if (IRREGULAR_PLURALS[word]) {
		return IRREGULAR_PLURALS[word];
	}
	if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) {
		return `${word.slice(0, -1)}ies`;
	}
	if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z')) {
		return `${word}es`;
	}
	return `${word}s`;
}

function singularize(word: string): string {
	if (IRREGULAR_SINGULARS[word]) {
		return IRREGULAR_SINGULARS[word];
	}
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

/** `User` → `users`, `Admin::User` uses last segment. */
export function tableize(classOrTable: string): string {
	const base = classOrTable.includes('::')
		? classOrTable.split('::').pop()!
		: classOrTable;
	const snake = underscore(base);
	const singular = singularize(snake);
	return pluralize(singular);
}

/** `users` → `User` */
export function classify(tableName: string): string {
	const singular = singularize(tableName);
	return singular
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
}

/** `admin_roles` / `employees` → `AdminRole` / `Employee` (singularizes last segment). */
export function classifyAssociationName(associationName: string): string {
	const parts = associationName.split('_');
	const last = parts.length - 1;
	parts[last] = singularize(parts[last]);
	return classify(parts.join('_'));
}