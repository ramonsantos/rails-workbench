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

## Requirements

A Rails project with `config/environment.rb` somewhere above the open file in the workspace tree.