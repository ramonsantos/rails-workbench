import * as assert from 'node:assert';
import {
	isValidHexColor,
	resolvePublicMethodColor,
	scanPublicMethods,
} from '../methodVisibility/scanPublicMethods';

function names(source: string): string[] {
	const ranges = scanPublicMethods(source);
	return ranges.map((r) => source.slice(r.start, r.end));
}

suite('scanPublicMethods', () => {
	test('defs before private are public', () => {
		const source = `class Foo
  def visible
  end
  private
  def hidden
  end
end`;
		assert.deepStrictEqual(names(source), ['visible']);
	});

	test('protected section excludes methods from highlight', () => {
		const source = `class Foo
  def open
  end
  protected
  def guarded
  end
end`;
		assert.deepStrictEqual(names(source), ['open']);
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
		assert.deepStrictEqual(names(source), ['visible_again']);
	});

	test('inline private def does not affect next def', () => {
		const source = `class Foo
  private def secret
  end
  def open
  end
end`;
		assert.deepStrictEqual(names(source), ['open']);
	});

	test('inline public def under private default', () => {
		const source = `class Foo
  private
  public def forced
  end
end`;
		assert.deepStrictEqual(names(source), ['forced']);
	});

	test('def self.foo highlights foo', () => {
		const source = `class Foo
  def self.bar
  end
end`;
		assert.deepStrictEqual(names(source), ['bar']);
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
		assert.deepStrictEqual(names(source), ['inner_public']);
	});

	test('private inside method body does not affect class defs', () => {
		const source = `class Foo
  def wrapper
    private
  end
  def after_wrapper
  end
end`;
		assert.deepStrictEqual(names(source), ['wrapper', 'after_wrapper']);
	});

	test('comment private does not change visibility', () => {
		const source = `class Foo
  def one
  end
  # private
  def two
  end
end`;
		assert.deepStrictEqual(names(source), ['one', 'two']);
	});

	test('string containing private does not change visibility', () => {
		const source = `class Foo
  MSG = "private"
  def still_public
  end
end`;
		assert.deepStrictEqual(names(source), ['still_public']);
	});

	test('module behaves like class', () => {
		const source = `module M
  def api
  end
end`;
		assert.deepStrictEqual(names(source), ['api']);
	});

	test('top-level def is ignored', () => {
		const source = `def global
end`;
		assert.deepStrictEqual(names(source), []);
	});

	test('nested def inside method is ignored', () => {
		const source = `class Foo
  def outer
    def inner
    end
  end
end`;
		assert.deepStrictEqual(names(source), ['outer']);
	});
});

suite('resolvePublicMethodColor', () => {
	test('accepts valid hex', () => {
		assert.strictEqual(resolvePublicMethodColor('#AABBCC'), '#AABBCC');
		assert.strictEqual(resolvePublicMethodColor('#abc'), '#abc');
	});

	test('falls back on invalid hex', () => {
		assert.strictEqual(resolvePublicMethodColor('red'), '#3DDC97');
	});

	test('isValidHexColor', () => {
		assert.strictEqual(isValidHexColor('#123456'), true);
		assert.strictEqual(isValidHexColor('#12G'), false);
	});
});