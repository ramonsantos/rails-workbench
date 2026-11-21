import * as assert from 'node:assert';
import { pickLatestMigration } from '../migrations/pickLatestMigration';

suite('pickLatestMigration', () => {
	test('picks newest timestamped migration', () => {
		const files = [
			'20240101000000_create_users.rb',
			'20240615120000_add_index.rb',
			'20240501000000_rename_column.rb',
			'.keep',
			'README',
		];
		assert.strictEqual(
			pickLatestMigration(files),
			'20240615120000_add_index.rb',
		);
	});

	test('picks highest numeric prefix', () => {
		assert.strictEqual(
			pickLatestMigration(['001_users.rb', '010_posts.rb', '002_comments.rb']),
			'010_posts.rb',
		);
	});

	test('returns undefined when empty', () => {
		assert.strictEqual(pickLatestMigration([]), undefined);
		assert.strictEqual(
			pickLatestMigration(['schema.rb', 'structure.sql']),
			undefined,
		);
	});
});