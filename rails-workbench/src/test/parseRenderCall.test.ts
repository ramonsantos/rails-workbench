import * as assert from 'node:assert';
import { parseRenderCall } from '../partials/parseRenderCall';

suite('parseRenderCall', () => {
	test('shorthand render when cursor inside the string', () => {
		const line = `  <%= render "products/form" %>`;
		const cursor = line.indexOf('products');
		const match = parseRenderCall(line, cursor);
		assert.ok(match);
		assert.strictEqual(match.partialName, 'products/form');
	});

	test('explicit partial: syntax', () => {
		const line = `render partial: 'admin/areas/form'`;
		const cursor = line.indexOf('admin');
		const match = parseRenderCall(line, cursor);
		assert.ok(match);
		assert.strictEqual(match.partialName, 'admin/areas/form');
	});

	test('hash rocket partial', () => {
		const line = `render :partial => "shared/user-card"`;
		const cursor = line.indexOf('user-card');
		const match = parseRenderCall(line, cursor);
		assert.ok(match);
		assert.strictEqual(match.partialName, 'shared/user-card');
	});

	test('returns null when cursor is on render keyword', () => {
		const line = `render "products/form"`;
		const cursor = line.indexOf('render');
		assert.strictEqual(parseRenderCall(line, cursor), null);
	});

	test('ignores render template', () => {
		const line = `render template: "products/show"`;
		const cursor = line.indexOf('products');
		assert.strictEqual(parseRenderCall(line, cursor), null);
	});

	test('ignores render file', () => {
		const line = `render file: "products/show"`;
		const cursor = line.indexOf('products');
		assert.strictEqual(parseRenderCall(line, cursor), null);
	});

	test('does not fall back to shorthand when partial keyword is present', () => {
		const line = `render partial: "form"`;
		const cursor = line.indexOf('render');
		assert.strictEqual(parseRenderCall(line, cursor), null);
	});
});