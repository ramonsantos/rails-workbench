const MIGRATION_FILE = /^\d+_[\w.]+\.rb$/;

/**
 * Picks the newest Rails migration by filename (timestamp / version prefix).
 */
export function pickLatestMigration(filenames: readonly string[]): string | undefined {
	const migrations = filenames.filter((name) => MIGRATION_FILE.test(name));
	if (migrations.length === 0) {
		return undefined;
	}
	return migrations.reduce((latest, name) => (name > latest ? name : latest));
}