import * as assert from 'node:assert';
import * as path from 'node:path';
import { controllerRbPath } from '../routes/controllerPath';

suite('controllerRbPath', () => {
	const railsRoot = path.join('/app', 'myshop');

	test('flat controller', () => {
		assert.strictEqual(
			controllerRbPath(railsRoot, 'products'),
			path.join(railsRoot, 'app', 'controllers', 'products_controller.rb'),
		);
	});

	test('namespaced controller', () => {
		assert.strictEqual(
			controllerRbPath(railsRoot, 'admin/products'),
			path.join(
				railsRoot,
				'app',
				'controllers',
				'admin',
				'products_controller.rb',
			),
		);
	});
});