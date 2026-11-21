import * as assert from 'node:assert';
import { parseUrlHelperAtPosition } from '../routes/parseUrlHelper';

suite('parseUrlHelper', () => {
	test('detects path helper at cursor', () => {
		const line = 'link_to "Show", product_path(@product)';
		const cursor = line.indexOf('product_path');
		const match = parseUrlHelperAtPosition(line, cursor + 3);
		assert.ok(match);
		assert.strictEqual(match!.helper, 'product');
	});

	test('detects url helper', () => {
		const line = 'redirect_to products_url';
		const cursor = line.indexOf('products_url');
		const match = parseUrlHelperAtPosition(line, cursor + 1);
		assert.ok(match);
		assert.strictEqual(match!.helper, 'products');
	});

	test('returns null when cursor is outside helper', () => {
		const line = 'redirect_to @product';
		assert.strictEqual(parseUrlHelperAtPosition(line, 5), null);
	});
});