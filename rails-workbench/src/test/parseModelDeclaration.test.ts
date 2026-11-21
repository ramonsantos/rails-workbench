import * as assert from 'node:assert';
import {
	parseExplicitTableName,
	parseModelDeclarationAtPosition,
} from '../schema/parseModelDeclaration';

suite('parseModelDeclarationAtPosition', () => {
	test('class name at cursor', () => {
		const line = 'class User < ApplicationRecord';
		const match = parseModelDeclarationAtPosition(line, line.indexOf('User'));
		assert.ok(match);
		assert.strictEqual(match.className, 'User');
	});

	test('namespaced class', () => {
		const line = 'class Admin::User < ApplicationRecord';
		const match = parseModelDeclarationAtPosition(line, line.indexOf('Admin'));
		assert.ok(match);
		assert.strictEqual(match.className, 'Admin::User');
	});

	test('ApplicationRecord does not navigate', () => {
		const line = 'class ApplicationRecord < ActiveRecord::Base';
		assert.strictEqual(
			parseModelDeclarationAtPosition(line, line.indexOf('ApplicationRecord')),
			null,
		);
	});

	test('explicit table_name', () => {
		const source = `class Legacy < ApplicationRecord
  self.table_name = "legacy_employees"
end`;
		assert.strictEqual(parseExplicitTableName(source), 'legacy_employees');
	});
});