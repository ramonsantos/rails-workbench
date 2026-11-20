import * as path from 'node:path';

/** Directories to walk upward from (inclusive), deepest first. */
export function railsRootCandidates(startDir: string): string[] {
	const candidates: string[] = [];
	let dir = path.resolve(startDir);
	const root = path.parse(dir).root;
	while (true) {
		candidates.push(dir);
		if (dir === root) {
			break;
		}
		const parent = path.dirname(dir);
		if (parent === dir) {
			break;
		}
		dir = parent;
	}
	return candidates;
}

export function environmentRbPath(railsRoot: string): string {
	return path.join(railsRoot, 'config', 'environment.rb');
}