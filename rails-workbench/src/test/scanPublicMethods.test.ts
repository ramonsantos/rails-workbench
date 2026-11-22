import * as assert from 'node:assert';
import {
	isValidHexColor,
	parseOptionalMethodColor,
	scanMethodsByVisibility,
	scanPublicMethods,
} from '../methodVisibility/scanPublicMethods';

function names(
	source: string,
	visibility: 'public' | 'private' | 'protected' = 'public',
): string[] {
	const ranges = scanMethodsByVisibility(source)[visibility];
	return ranges.map((r) => source.slice(r.start, r.end));
}

suite('scanMethodsByVisibility', () => {
	test('defs before private are public', () => {
		const source = `class Foo
  def visible
  end
  private
  def hidden
  end
end`;
		assert.deepStrictEqual(names(source, 'public'), ['visible']);
		assert.deepStrictEqual(names(source, 'private'), ['hidden']);
	});

	test('protected section', () => {
		const source = `class Foo
  def open
  end
  protected
  def guarded
  end
end`;
		assert.deepStrictEqual(names(source, 'public'), ['open']);
		assert.deepStrictEqual(names(source, 'protected'), ['guarded']);
	});

	test('public restores following defs', () => {
		const source = `class Foo
  private
  def hidden
  end
  public
  def visible_again
  end
end`;
		assert.deepStrictEqual(names(source, 'public'), ['visible_again']);
		assert.deepStrictEqual(names(source, 'private'), ['hidden']);
	});

	test('inline private def does not affect next def', () => {
		const source = `class Foo
  private def secret
  end
  def open
  end
end`;
		assert.deepStrictEqual(names(source, 'public'), ['open']);
		assert.deepStrictEqual(names(source, 'private'), ['secret']);
	});

	test('inline public def under private default', () => {
		const source = `class Foo
  private
  public def forced
  end
end`;
		assert.deepStrictEqual(names(source, 'public'), ['forced']);
	});

	test('def self.foo highlights foo', () => {
		const source = `class Foo
  def self.bar
  end
end`;
		assert.deepStrictEqual(names(source, 'public'), ['bar']);
	});

	test('nested class resets to public', () => {
		const source = `class Outer
  private
  def outer_hidden
  end
  class Inner
    def inner_public
    end
  end
end`;
		assert.deepStrictEqual(names(source, 'public'), ['inner_public']);
		assert.deepStrictEqual(names(source, 'private'), ['outer_hidden']);
	});

	test('private inside method body does not affect class defs', () => {
		const source = `class Foo
  def wrapper
    private
  end
  def after_wrapper
  end
end`;
		assert.deepStrictEqual(names(source, 'public'), [
			'wrapper',
			'after_wrapper',
		]);
	});

	test('comment private does not change visibility', () => {
		const source = `class Foo
  def one
  end
  # private
  def two
  end
end`;
		assert.deepStrictEqual(names(source, 'public'), ['one', 'two']);
	});

	test('string containing private does not change visibility', () => {
		const source = `class Foo
  MSG = "private"
  def still_public
  end
end`;
		assert.deepStrictEqual(names(source, 'public'), ['still_public']);
	});

	test('module behaves like class', () => {
		const source = `module M
  def api
  end
end`;
		assert.deepStrictEqual(names(source, 'public'), ['api']);
	});

	test('top-level def is ignored', () => {
		const source = `def global
end`;
		assert.deepStrictEqual(scanMethodsByVisibility(source).public, []);
	});

	test('nested def inside method is ignored', () => {
		const source = `class Foo
  def outer
    def inner
    end
  end
end`;
		assert.deepStrictEqual(names(source, 'public'), ['outer']);
	});

	test('scanPublicMethods returns only public ranges', () => {
		const source = `class Foo
  def a
  end
  private
  def b
  end
end`;
		assert.deepStrictEqual(
			scanPublicMethods(source).map((r) => source.slice(r.start, r.end)),
			['a'],
		);
	});
});

suite('parseOptionalMethodColor', () => {
	test('empty uses theme default', () => {
		assert.strictEqual(parseOptionalMethodColor(''), undefined);
		assert.strictEqual(parseOptionalMethodColor(undefined), undefined);
		assert.strictEqual(parseOptionalMethodColor('   '), undefined);
	});

	test('accepts valid hex', () => {
		assert.strictEqual(parseOptionalMethodColor('#AABBCC'), '#AABBCC');
		assert.strictEqual(parseOptionalMethodColor('  #abc  '), '#abc');
	});

	test('invalid hex does not highlight', () => {
		assert.strictEqual(parseOptionalMethodColor('red'), undefined);
	});

	test('isValidHexColor', () => {
		assert.strictEqual(isValidHexColor('#123456'), true);
		assert.strictEqual(isValidHexColor('#12G'), false);
	});
});