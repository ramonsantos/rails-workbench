import * as assert from 'node:assert';
import { parseCreateTableNameAtPosition } from '../schema/parseCreateTableName';

function at(line: string, token: string): number {
	return line.indexOf(token);
}

suite('parseCreateTableNameAtPosition', () => {
	test('quoted table name', () => {
		const line = '  create_table "users" do |t|';
		const match = parseCreateTableNameAtPosition(line, at(line, 'users'));
		assert.ok(match);
		assert.strictEqual(match.tableName, 'users');
	});

	test('symbol table name', () => {
		const line = '  create_table :people do |t|';
		const match = parseCreateTableNameAtPosition(line, at(line, 'people'));
		assert.ok(match);
		assert.strictEqual(match.tableName, 'people');
	});

	test('returns null outside table name', () => {
		const line = '  create_table "users" do |t|';
		assert.strictEqual(parseCreateTableNameAtPosition(line, at(line, 'create')), null);
	});
});