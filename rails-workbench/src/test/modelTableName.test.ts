import * as assert from 'node:assert';
import { modelClassCandidatesFromTable, tableNameForModelClass } from '../schema/modelTableName';
import { modelClassToRelativePath } from '../models/resolveModelPath';
import * as path from 'node:path';

suite('modelTableName', () => {
	test('tableNameForModelClass flat', () => {
		assert.strictEqual(tableNameForModelClass('User'), 'users');
	});

	test('tableNameForModelClass namespaced', () => {
		assert.strictEqual(tableNameForModelClass('Admin::User'), 'admin_users');
	});

	test('modelClassCandidatesFromTable includes flat and namespaced paths', () => {
		const candidates = modelClassCandidatesFromTable('admin_users');
		assert.ok(candidates.includes('AdminUser'));
		assert.ok(candidates.includes('Admin::User'));

		const paths = candidates.map((c) => modelClassToRelativePath(c));
		assert.ok(paths.includes(path.join('app', 'models', 'admin_user.rb')));
		assert.ok(paths.includes(path.join('app', 'models', 'admin', 'user.rb')));
	});
});