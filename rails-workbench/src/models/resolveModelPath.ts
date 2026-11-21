import * as path from 'node:path';

function segmentToSnake(segment: string): string {
	return segment
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
		.replace(/([a-z\d])([A-Z])/g, '$1_$2')
		.toLowerCase();
}

/** `Account` → `app/models/account.rb`; `Admin::User` → `app/models/admin/user.rb`. */
export function modelClassToRelativePath(modelClass: string): string {
	const segments = modelClass.split('::').map(segmentToSnake);
	const fileName = `${segments.pop()!}.rb`;
	return path.join('app', 'models', ...segments, fileName);
}

export function resolveModelFilePath(
	railsRoot: string,
	modelClass: string,
): string {
	return path.join(railsRoot, modelClassToRelativePath(modelClass));
}