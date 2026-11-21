export interface RouteRecord {
	methods: ReadonlySet<string>;
	actions: ReadonlySet<string>;
	params: readonly string[];
	controller: string;
	url: string;
}

export type RouteIndex = ReadonlyMap<string, RouteRecord>;