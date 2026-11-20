# Rails Workbench

Monorepo of tools for **Ruby on Rails** development in VS Code and Cursor. The goal is an integrated productivity experience for Rails in the editor.

## Structure

| Directory | Role |
|-----------|------|
| [`rails-workbench/`](rails-workbench/) | VS Code extension (TypeScript): commands, UI, editor integration, and Rails feature orchestration. |
| [`rails-workbench-lsp/`](rails-workbench-lsp/) | Language Server Protocol (LSP) for Rails: code analysis and language intelligence. |

Some logic lives in the extension (user and editor interaction); some will live in the LSP (analysis and protocol). Both packages evolve together in this repository.

## Rails Workbench (extension)

- Stack: TypeScript, VS Code Extension API.
- Source: `rails-workbench/src/`.
- Build: `npm run compile` inside `rails-workbench/`.
- Extension details: [`rails-workbench/README.md`](rails-workbench/README.md).

## Rails Workbench LSP

- Language server for Rails conventions and workflows.
- LSP-specific code and docs live under `rails-workbench-lsp/`.

## Development

Open the **repository root** in Cursor or VS Code to work on both packages with shared ignore rules.

```bash
# Extension
cd rails-workbench
npm install
npm run compile

# LSP — follow the package README once the project is initialized
cd ../rails-workbench-lsp
```

## Cursor

- [`.cursorignore`](.cursorignore) — index/context exclusions for the monorepo.
- [`rails-workbench/.cursorignore`](rails-workbench/.cursorignore) — when opening only the extension folder.
- [`rails-workbench-lsp/.cursorignore`](rails-workbench-lsp/.cursorignore) — when opening only the LSP folder.
- [`AGENTS.md`](AGENTS.md) — conventions for contributors and AI agents (including English-only content).