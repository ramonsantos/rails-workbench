import * as assert from 'node:assert';
import * as path from 'node:path';
import { parseColumnAccessAtPosition } from '../schema/parseColumnAccess';
import { parseSchema } from '../schema/parseSchema';
import { resolveTable } from '../schema/resolveTable';

const SCHEMA = `
create_table "users" do |t|
  t.string "email"
end
`;

suite('resolveTable', () => {
	const parsed = parseSchema(SCHEMA);
	const modelPath = path.join('/app', 'myapp', 'app', 'models', 'user.rb');

	test('resolves receiver to table', () => {
		const table = resolveTable(parsed, 'user', modelPath);
		assert.ok(table);
		assert.ok(table!.columns.get('email'));
	});

	test('resolves model file without receiver', () => {
		const table = resolveTable(parsed, undefined, modelPath);
		assert.ok(table);
	});

	test('parseColumnAccessAtPosition on dotted access', () => {
		const line = 'user.email';
		const match = parseColumnAccessAtPosition(line, line.indexOf('email'));
		assert.ok(match);
		assert.strictEqual(match!.receiver, 'user');
		assert.strictEqual(match!.column, 'email');
	});
});