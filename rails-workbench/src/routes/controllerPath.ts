import * as path from 'node:path';

/**
 * `admin/products` → `app/controllers/admin/products_controller.rb`
 */
export function controllerRbPath(railsRoot: string, controller: string): string {
	const segments = controller.split('/');
	const fileName = `${segments.pop() ?? controller}_controller.rb`;
	return path.join(railsRoot, 'app', 'controllers', ...segments, fileName);
}