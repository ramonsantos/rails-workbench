import * as assert from 'node:assert';
import { parseSchema } from '../schema/parseSchema';

const FIXTURE = `
ActiveRecord::Schema[8.0].define(version: 2024_01_01_000000) do
  create_table "users" do |t|
    t.string "email", null: false, comment: "login"
    t.string :name
    t.timestamps
    t.index ["email"], unique: true
  end

  create_table :people do |t|
    t.integer "age"
  end
end
`;

suite('parseSchema', () => {
	test('parses quoted and symbol table and column names', () => {
		const { tables } = parseSchema(FIXTURE);
		const users = tables.get('users');
		assert.ok(users);
		assert.strictEqual(users!.className, 'User');
		assert.ok(users!.columns.get('email'));
		assert.strictEqual(users!.columns.get('email')!.comment, 'login');
		assert.ok(users!.columns.get('name'));
		assert.strictEqual(users!.columns.get('name')!.columnType, 'string');
	});

	test('skips index and timestamps', () => {
		const { tables } = parseSchema(FIXTURE);
		const users = tables.get('users');
		assert.strictEqual(users!.columns.size, 2);
	});

	test('parses symbol create_table', () => {
		const { tables } = parseSchema(FIXTURE);
		assert.ok(tables.get('people'));
		assert.ok(tables.get('people')!.columns.get('age'));
	});
});