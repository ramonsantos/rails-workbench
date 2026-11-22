# Rails Workbench

VS Code extension for **Ruby on Rails** productivity.

## Local install

From this directory:

```bash
npm install
npm run compile && npx @vscode/vsce package --no-dependencies && code --install-extension ./rails-workbench-0.0.1.vsix --force
```

The `.vsix` name matches `version` in `package.json`. Reload the editor window after install.

## Features

### Activity Bar (Rails Workbench view)

- **Open latest migration** under `db/migrate/`
- **Find unused routes** — loads `rails routes`, scans the app for `*_path` / `*_url` tokens, reports unused named routes in a Markdown editor tab
- **Create unused routes config** — writes `.rails-workbench.yml` at the Rails root (see below)

### Partial go to definition

In **ERB**, **Haml**, and **Slim** files, with the cursor inside the string of a partial `render`, use **Go to Definition** (F12) to open the matching partial under `app/views` (or relative to the current template).

Supported forms include:

- `render "products/form"`
- `render partial: "admin/header"`
- `render :partial => 'shared/footer'`

When locale or variant files exist (`_form.en.html.erb`, `_form.html+phone.erb`), all matching candidates are offered.

### Database schema (`db/schema.rb`)

In **Ruby**, **ERB**, **Haml**, and **Slim**:

- **Go to Definition** on `user.email` or a column inside an `app/models` file opens the column line in `db/schema.rb` (only when the column exists in the parsed schema).
- **Completion** after `.` on a table/receiver, on `validates :`, or on `Model.human_attribute_name :`.
- Commands **Open Schema Table** and **Insert Schema Column**.

Requires `db/schema.rb` in the project. For `schema_format = :sql`, keep generating a Ruby schema dump in development (see legacy Rails DB Schema docs).

### Models and associations

In **Ruby** files under `app/models`, **Go to Definition** on `has_many`, `belongs_to`, `has_one`, and related macros jumps to the associated model when the target can be resolved.

### URL helpers (routes)

In **Ruby**, **ERB**, **Haml**, and **Slim**:

- **Go to Definition** on `products_path` / `products_url` opens the matching controller action(s).
- **Completion** after `link_to`, `redirect_to`, `visit`, `path:`, etc.
- Command **Rails Workbench: Insert URL Helper**.

Routes are loaded by running a configurable shell command (default `bundle exec rails routes`). For Docker:

- `rails-workbench.routes.command`: e.g. `docker compose exec -T web bin/rails routes`
- `rails-workbench.routes.workingDirectory`: directory where that command should run (when not the Rails root).

### Unused routes

Optional project file **`.rails-workbench.yml`** at the Rails application root:

- `unused_routes.primary_directories` — scanned first (default: `app/views`, `app/controllers`)
- `unused_routes.ignore_patterns` — Ruby regexes on route helper names (e.g. Devise, Active Storage)

Analysis is static (`helper_path` / `helper_url` tokens only); dynamic `url_for` or `polymorphic_path` usage may produce false positives.

### Method visibility (Ruby)

In **Ruby** class/module files, optionally color **method names** by visibility:

- `rails-workbench.methodVisibility.publicMethodColor`
- `rails-workbench.methodVisibility.privateMethodColor`
- `rails-workbench.methodVisibility.protectedMethodColor`

Leave a setting empty to keep the theme default. Set a hex color (e.g. `#3DDC97`) to enable highlighting for that visibility.

## Configuration

- `rails-workbench.partials.viewFileExtensions`: template extensions used when resolving partials (default: `html.erb`, `html.haml`, `html.slim`).

## Requirements

A Rails project with `config/environment.rb` somewhere above the open file in the workspace tree. Routes features require the configured command to succeed (Ruby/Bundler or Docker, not a running web server).

## Development

```bash
npm install
npm run compile
npm test
```

Package for local install:

```bash
npm run compile && npx @vscode/vsce package --no-dependencies
```