import * as assert from 'node:assert';
import * as path from 'node:path';
import {
	modelClassToRelativePath,
	resolveModelFilePath,
} from '../models/resolveModelPath';

suite('resolveModelPath', () => {
	test('simple model path', () => {
		assert.strictEqual(
			modelClassToRelativePath('Account'),
			path.join('app', 'models', 'account.rb'),
		);
	});

	test('namespaced model path', () => {
		assert.strictEqual(
			modelClassToRelativePath('Admin::User'),
			path.join('app', 'models', 'admin', 'user.rb'),
		);
	});

	test('resolve under rails root', () => {
		const root = '/projects/demo';
		assert.strictEqual(
			resolveModelFilePath(root, 'Admin::User'),
			path.join(root, 'app', 'models', 'admin', 'user.rb'),
		);
	});
});