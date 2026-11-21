import * as assert from 'node:assert';
import { parseAssociationAtPosition } from '../models/parseAssociation';

function at(line: string, token: string): number {
	return line.indexOf(token);
}

suite('parseAssociationAtPosition', () => {
	test('infers model from singular association name', () => {
		const line = '  belongs_to :account';
		const match = parseAssociationAtPosition(line, at(line, 'account'));
		assert.ok(match);
		assert.strictEqual(match.modelClass, 'Account');
	});

	test('infers plural association name', () => {
		const line = '  has_many :employees';
		const match = parseAssociationAtPosition(line, at(line, 'employees'));
		assert.ok(match);
		assert.strictEqual(match.modelClass, 'Employee');
	});

	test('class_name overrides association name target', () => {
		const line = "  belongs_to :account, class_name: 'ApiSession'";
		const onName = parseAssociationAtPosition(line, at(line, 'account'));
		assert.ok(onName);
		assert.strictEqual(onName.modelClass, 'ApiSession');

		const onClassName = parseAssociationAtPosition(
			line,
			at(line, 'ApiSession'),
		);
		assert.ok(onClassName);
		assert.strictEqual(onClassName.modelClass, 'ApiSession');
	});

	test('class_name constant syntax', () => {
		const line = '  has_one :profile, class_name: Account';
		const match = parseAssociationAtPosition(line, at(line, 'Account'));
		assert.ok(match);
		assert.strictEqual(match.modelClass, 'Account');
	});

	test('namespaced class_name', () => {
		const line = '  belongs_to :user, class_name: "Admin::User"';
		const match = parseAssociationAtPosition(line, at(line, 'Admin'));
		assert.ok(match);
		assert.strictEqual(match.modelClass, 'Admin::User');
	});

	test('through resolves join model separately from association name', () => {
		const line =
			'  has_many :admin_roles, through: :employee_admin_roles';
		const onAdminRoles = parseAssociationAtPosition(
			line,
			at(line, 'admin_roles'),
		);
		assert.ok(onAdminRoles);
		assert.strictEqual(onAdminRoles.modelClass, 'AdminRole');

		const onThrough = parseAssociationAtPosition(
			line,
			at(line, 'employee_admin_roles'),
		);
		assert.ok(onThrough);
		assert.strictEqual(onThrough.modelClass, 'EmployeeAdminRole');
	});

	test('source uses source_type when present', () => {
		const line =
			"  has_many :notes, through: :links, source: :student_notes, source_type: 'Employee'";
		const onSource = parseAssociationAtPosition(
			line,
			at(line, 'student_notes'),
		);
		assert.ok(onSource);
		assert.strictEqual(onSource.modelClass, 'Employee');

		const onSourceType = parseAssociationAtPosition(
			line,
			at(line, 'Employee'),
		);
		assert.ok(onSourceType);
		assert.strictEqual(onSourceType.modelClass, 'Employee');
	});

	test('has_and_belongs_to_many', () => {
		const line = '  has_and_belongs_to_many :tags';
		const match = parseAssociationAtPosition(line, at(line, 'tags'));
		assert.ok(match);
		assert.strictEqual(match.modelClass, 'Tag');
	});

	test('polymorphic association name does not navigate', () => {
		const line = '  belongs_to :authenticatable, polymorphic: true';
		assert.strictEqual(
			parseAssociationAtPosition(line, at(line, 'authenticatable')),
			null,
		);
	});

	test('polymorphic still allows class_name navigation', () => {
		const line =
			"  belongs_to :authenticatable, polymorphic: true, class_name: 'User'";
		const match = parseAssociationAtPosition(line, at(line, 'User'));
		assert.ok(match);
		assert.strictEqual(match.modelClass, 'User');
	});

	test('ignores non-model options like dependent', () => {
		const line = '  has_many :invoices, dependent: :destroy';
		assert.strictEqual(
			parseAssociationAtPosition(line, at(line, 'dependent')),
			null,
		);
	});

	test('continuation line with through on next line', () => {
		const line1 = '  has_many :grades,';
		const line2 = '         through: :enrollment_grades';
		const match = parseAssociationAtPosition(line2, at(line2, 'enrollment_grades'), {
			previousLine: line1,
		});
		assert.ok(match);
		assert.strictEqual(match.modelClass, 'EnrollmentGrade');
	});
});