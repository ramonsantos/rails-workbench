# Rails Workbench

Monorepo of tools for **Ruby on Rails** development in VS Code and Cursor. The goal is an integrated productivity experience for Rails in the editor.

## Structure

| Directory | Role |
|-----------|------|
| [`rails-workbench/`](rails-workbench/) | VS Code extension (TypeScript): commands, UI, editor integration, and Rails feature orchestration. |
| [`rails-workbench-lsp/`](rails-workbench-lsp/) | Language Server Protocol (LSP) for Rails: code analysis and language intelligence (planned). |

Some logic lives in the extension (user and editor interaction); future Rails-specific analysis may also live in the LSP. Both packages evolve together in this repository.

## What the extension provides today

See [`rails-workbench/README.md`](rails-workbench/README.md) for the full feature list and settings. Highlights:

- Partial **Go to Definition** (ERB, Haml, Slim)
- `db/schema.rb` navigation, completion, and commands
- **URL helpers** from configurable `rails routes` output (go-to-definition, completion, insert helper)
- **Models**: association go-to-definition
- **Activity Bar** home view: latest migration, unused-route analysis, project config scaffold
- Optional **method visibility** colors in Ruby classes (`public` / `private` / `protected`)

Project-specific unused-route scanning uses [`.rails-workbench.yml`](.rails-workbench.yml) at the Rails app root (created from the extension).

## Development

Open the **repository root** in Cursor or VS Code to work on both packages with shared ignore rules.

**Prerequisites:** Node.js and npm.

```bash
cd rails-workbench
npm install
npm run compile
npm test
```

The LSP package under `rails-workbench-lsp/` is a placeholder until it is initialized.

### Local install in VS Code

From `rails-workbench/` (after `npm install`):

```bash
npm run compile && npx @vscode/vsce package --no-dependencies && code --install-extension ./rails-workbench-0.0.1.vsix --force
```

The `.vsix` filename includes the `version` field from `package.json`; adjust the path if you bump the version. Use `cursor --install-extension` instead of `code` when installing into Cursor.

Reload the window after installing so activation events apply.

## Cursor

- [`.cursorignore`](.cursorignore) — index/context exclusions for the monorepo.
- [`rails-workbench/.cursorignore`](rails-workbench/.cursorignore) — when opening only the extension folder.
- [`rails-workbench-lsp/.cursorignore`](rails-workbench-lsp/.cursorignore) — when opening only the LSP folder.
- [`AGENTS.md`](AGENTS.md) — conventions for contributors and AI agents (including English-only content).