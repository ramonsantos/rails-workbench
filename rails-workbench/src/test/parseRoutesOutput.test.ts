import * as assert from 'node:assert';
import { parseRoutesOutput } from '../routes/parseRoutesOutput';

const FIXTURE = `
                                  Prefix Verb   URI Pattern                       Controller#Action
        products GET    /products(.:format)          products#index
                 POST   /products(.:format)          products#create
         product GET    /products/:id(.:format)      products#show
    admin_products GET    /admin/products(.:format)    admin/products#index
`;

suite('parseRoutesOutput', () => {
	test('parses named helpers and continuation rows', () => {
		const index = parseRoutesOutput(FIXTURE);
		const products = index.get('products');
		assert.ok(products);
		assert.ok(products!.actions.has('index'));
		assert.ok(products!.actions.has('create'));
		assert.deepStrictEqual(products!.params, []);

		const product = index.get('product');
		assert.ok(product);
		assert.ok(product!.actions.has('show'));
		assert.deepStrictEqual(product!.params, ['id']);
	});

	test('parses namespaced controllers', () => {
		const index = parseRoutesOutput(FIXTURE);
		const admin = index.get('admin_products');
		assert.ok(admin);
		assert.strictEqual(admin!.controller, 'admin/products');
		assert.ok(admin!.actions.has('index'));
	});

	test('parses Rails 8 Routes for application banner', () => {
		const output = `Routes for application:
                                      Prefix Verb   URI Pattern                       Controller#Action
                             admin_employees GET    /admin/employees(.:format)        admin/employees#index
                          new_admin_employee GET    /admin/employees/new(.:format)    admin/employees#new`;
		const index = parseRoutesOutput(output);
		assert.ok(index.get('admin_employees'));
		assert.ok(index.get('new_admin_employee'));
	});

	test('ignores engine route blocks', () => {
		const output = `
Routes for Rswag::Ui::Engine:
  rswag_ui GET /api-docs rswag/ui/home#index

        products GET /products(.:format) products#index
`;
		const index = parseRoutesOutput(output);
		assert.strictEqual(index.has('rswag_ui'), false);
		assert.ok(index.get('products'));
	});

	test('supports combined HTTP verbs', () => {
		const output = `login GET|POST /login(.:format) sessions#new`;
		const index = parseRoutesOutput(output);
		const login = index.get('login');
		assert.ok(login);
		assert.ok(login!.methods.has('GET'));
		assert.ok(login!.methods.has('POST'));
	});
});
