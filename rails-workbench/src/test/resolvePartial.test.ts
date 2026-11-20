import * as assert from 'node:assert';
import * as path from 'node:path';
import {
	collectPartialFilenames,
	isMatchingPartialFile,
	normalizePartialBasename,
	resolvePartialLocation,
} from '../partials/resolvePartial';
import {
	environmentRbPath,
	railsRootCandidates,
} from '../partials/railsRoot';

suite('resolvePartial', () => {
	const railsRoot = path.join('/app', 'myapp');
	const viewFile = path.join(
		railsRoot,
		'app',
		'views',
		'products',
		'index.html.erb',
	);

	test('normalizePartialBasename strips leading underscore', () => {
		assert.strictEqual(normalizePartialBasename('_form'), 'form');
		assert.strictEqual(normalizePartialBasename('form'), 'form');
	});

	test('absolute partial path under app/views', () => {
		const { directory, basename } = resolvePartialLocation(
			viewFile,
			railsRoot,
			'admin/areas/form',
		);
		assert.strictEqual(
			directory,
			path.join(railsRoot, 'app', 'views', 'admin', 'areas'),
		);
		assert.strictEqual(basename, 'form');
	});

	test('relative partial resolves beside current template', () => {
		const { directory, basename } = resolvePartialLocation(
			viewFile,
			railsRoot,
			'form',
		);
		assert.strictEqual(directory, path.dirname(viewFile));
		assert.strictEqual(basename, 'form');
	});

	test('does not duplicate underscore in basename segment', () => {
		const { basename } = resolvePartialLocation(
			viewFile,
			railsRoot,
			'shared/_menu',
		);
		assert.strictEqual(basename, 'menu');
	});

	test('matches locale and variant filenames', () => {
		const ext = ['html.erb'];
		assert.strictEqual(
			isMatchingPartialFile('_form.html.erb', 'form', ext),
			true,
		);
		assert.strictEqual(
			isMatchingPartialFile('_form.en.html.erb', 'form', ext),
			true,
		);
		assert.strictEqual(
			isMatchingPartialFile('_form.pt-BR.html.erb', 'form', ext),
			true,
		);
		assert.strictEqual(
			isMatchingPartialFile('_form.html+phone.erb', 'form', ext),
			true,
		);
		assert.strictEqual(
			isMatchingPartialFile('_other.html.erb', 'form', ext),
			false,
		);
	});

	test('collectPartialFilenames returns all variants', () => {
		const entries = [
			'_form.html.erb',
			'_form.en.html.erb',
			'_form.html+mobile.erb',
			'index.html.erb',
		];
		const names = collectPartialFilenames(entries, 'form', ['html.erb']);
		assert.deepStrictEqual(names, [
			'_form.en.html.erb',
			'_form.html+mobile.erb',
			'_form.html.erb',
		]);
	});
});

suite('railsRootCandidates', () => {
	test('walks upward from nested view path', () => {
		const view = path.join('/app', 'repo', 'app', 'views', 'home', 'index.html.erb');
		const candidates = railsRootCandidates(path.dirname(view));
		assert.strictEqual(candidates[0], path.join('/app', 'repo', 'app', 'views', 'home'));
		assert.ok(candidates.includes(path.join('/app', 'repo')));
		assert.strictEqual(
			environmentRbPath(path.join('/app', 'repo')),
			path.join('/app', 'repo', 'config', 'environment.rb'),
		);
	});
});