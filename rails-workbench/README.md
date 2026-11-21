# Rails Workbench

VS Code extension for **Ruby on Rails** productivity.

## Features

### Partial go to definition

In **ERB**, **Haml**, and **Slim** files, with the cursor inside the string of a partial `render`, use **Go to Definition** (F12) to open the matching partial under `app/views` (or relative to the current template).

Supported forms include:

- `render "products/form"`
- `render partial: "admin/header"`
- `render :partial => 'shared/footer'`

When locale or variant files exist (`_form.en.html.erb`, `_form.html+phone.erb`), all matching candidates are offered.

## Configuration

- `rails-workbench.partials.viewFileExtensions`: template extensions used when resolving partials (default: `html.erb`, `html.haml`, `html.slim`).

### URL helpers (routes)

In **Ruby**, **ERB**, **Haml**, and **Slim**:

- **Go to Definition** on `products_path` / `products_url` opens the matching controller action(s).
- **Completion** after `link_to`, `redirect_to`, `visit`, `path:`, etc.
- Command **Rails Workbench: Insert URL Helper**.

Routes are loaded by running a configurable shell command (default `bin/rails routes`). For Docker:

- `rails-workbench.routes.command`: e.g. `docker compose exec -T web bin/rails routes`
- `rails-workbench.routes.workingDirectory`: directory where that command should run (when not the Rails root).

## Requirements

A Rails project with `config/environment.rb` somewhere above the open file in the workspace tree. Routes features require the configured command to succeed (Ruby/Bundler or Docker, not a running web server).