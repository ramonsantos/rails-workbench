import type { RouteIndex, RouteRecord } from './routeTypes';

interface MutableRoute {
	methods: Set<string>;
	actions: Set<string>;
	params: string[];
	controller: string;
	url: string;
}

const ROUTE_ROW =
	/^(?:(\w+)\s+)?((?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)(?:\|(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS))*)\s+(\S+)\s+([^\s]+)#(\w+)\s*$/;

/** Rails 8+ prints this before the main route table. */
const ROUTES_FOR_APPLICATION = /^\s*Routes for application:/i;
/** Mounted engines, e.g. `Routes for MissionControl::Jobs::Engine`. */
const ROUTES_FOR_ENGINE = /^\s*Routes for .+::Engine\b/i;
const HEADER_PREFIX = /^\s*Prefix\s+Verb/i;
const APPLICATION_HEADER =
	/^\s*Prefix\s+Verb\s+URI Pattern\s+Controller#Action/i;

function extractParams(url: string): string[] {
	const withoutFormat = url.replace(/\(\.:format\)/g, '');
	return withoutFormat
		.split('/')
		.filter((part) => part.startsWith(':'))
		.map((part) => part.slice(1).replace(/[^a-zA-Z0-9_]/g, ''))
		.filter((name) => name.length > 0);
}

function splitMethods(verbColumn: string): string[] {
	return verbColumn.split('|').filter(Boolean);
}

function toRecord(entry: MutableRoute): RouteRecord {
	return {
		methods: entry.methods,
		actions: entry.actions,
		params: [...new Set(entry.params)],
		controller: entry.controller,
		url: entry.url,
	};
}

function shouldSkipLine(line: string): boolean {
	const trimmed = line.trim();
	if (trimmed.length === 0) {
		return true;
	}
	if (HEADER_PREFIX.test(line)) {
		return true;
	}
	if (ROUTES_FOR_ENGINE.test(line)) {
		return true;
	}
	return false;
}

function newMutable(
	url: string,
	controller: string,
	action: string,
	methods: string[],
): MutableRoute {
	return {
		methods: new Set(methods),
		actions: new Set([action]),
		params: extractParams(url),
		controller,
		url,
	};
}

/**
 * Parses stdout from `rails routes` into a helper-name → route record map.
 */
export function parseRoutesOutput(stdout: string): RouteIndex {
	const map = new Map<string, RouteRecord>();
	let lastHelper: string | null = null;
	let inEngineBlock = false;

	for (const rawLine of stdout.split(/\r?\n/)) {
		const line = rawLine.trimEnd();
		if (ROUTES_FOR_APPLICATION.test(line)) {
			inEngineBlock = false;
			lastHelper = null;
			continue;
		}
		if (ROUTES_FOR_ENGINE.test(line)) {
			inEngineBlock = true;
			lastHelper = null;
			continue;
		}
		if (inEngineBlock) {
			if (line.trim() === '') {
				inEngineBlock = false;
			}
			continue;
		}
		if (APPLICATION_HEADER.test(line)) {
			continue;
		}
		if (shouldSkipLine(line)) {
			continue;
		}

		const match = ROUTE_ROW.exec(line.trim());
		if (!match) {
			continue;
		}

		const [, helperColumn, verbs, url, controller, action] = match;
		const methods = splitMethods(verbs);

		if (helperColumn) {
			lastHelper = helperColumn;
			const entry = newMutable(url, controller, action, methods);
			map.set(helperColumn, toRecord(entry));
			continue;
		}

		if (!lastHelper) {
			continue;
		}

		const existing = map.get(lastHelper);
		if (!existing) {
			continue;
		}

		const mutable: MutableRoute = {
			methods: new Set([...existing.methods, ...methods]),
			actions: new Set(existing.actions),
			params: [...existing.params],
			controller: existing.controller,
			url: existing.url,
		};

		if (mutable.actions.has(action) && mutable.controller === controller) {
			methods.forEach((m) => mutable.methods.add(m));
		} else {
			mutable.actions.add(action);
			methods.forEach((m) => mutable.methods.add(m));
			mutable.params.push(...extractParams(url));
		}

		map.set(lastHelper, toRecord(mutable));
	}

	return map;
}
