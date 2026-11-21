import * as assert from 'node:assert';
import { classify, classifyAssociationName, tableize } from '../schema/inflect';

suite('inflect', () => {
	test('tableize model names', () => {
		assert.strictEqual(tableize('User'), 'users');
		assert.strictEqual(tableize('Employee'), 'employees');
	});

	test('tableize irregular plural', () => {
		assert.strictEqual(tableize('Person'), 'people');
	});

	test('classify table names', () => {
		assert.strictEqual(classify('users'), 'User');
		assert.strictEqual(classify('people'), 'Person');
	});

	test('classify association names', () => {
		assert.strictEqual(classifyAssociationName('employees'), 'Employee');
		assert.strictEqual(classifyAssociationName('admin_roles'), 'AdminRole');
	});
});