# Agent instructions — Rails Workbench

This file guides humans and AI agents working in this repository.

## Repository layout

| Path | Role |
|------|------|
| [`rails-workbench/`](rails-workbench/) | VS Code / Cursor extension (TypeScript) |
| [`rails-workbench-lsp/`](rails-workbench-lsp/) | Rails-focused Language Server (future) |

Open the **monorepo root** when working across both packages.

## Language policy (required)

**All project content must be written in English**, including:

- Source code: identifiers (types, classes, functions, variables, constants, files)
- Comments and docstrings in code
- `README.md`, `CHANGELOG.md`, `AGENTS.md`, and other documentation
- User-facing strings in the extension (`package.json` `displayName`/`description`, configuration descriptions, command titles)
- Commit messages and pull request descriptions (when contributing)

Do not introduce Portuguese or other languages in the codebase or docs unless explicitly requested for localization.

User-facing chat with contributors may be in any language; **artifacts in git stay in English**.

## Extension development (`rails-workbench/`)

- Entry: `src/extension.ts`
- Partial go-to-definition: `src/partials/` (`parseRenderCall`, `resolvePartial`, `definitionProvider`)
- URL helpers (routes): `src/routes/` (`parseRoutesOutput`, `loadRoutes`, definition/completion providers). Routes are loaded via configurable shell command `rails-workbench.routes.command`
- Build: `npm run compile` (output in `out/`, not committed)
- Tests: `npm test` (uses `@vscode/test-electron`; downloads VS Code into `.vscode-test/`)
- Local install: `npx @vscode/vsce package --no-dependencies` → install the generated `.vsix`

Activation: `onLanguage` for `erb`, `haml`, and `slim`.

## Engineering principles

- Keep changes small and scoped; match existing TypeScript and VS Code API patterns
- Prefer pure, testable modules for parsing and path resolution; use `vscode` APIs only at the edges (providers)
- Do not commit `node_modules/`, `out/`, `.vscode-test/`, `*.vsix`, or coverage output (see [`.gitignore`](.gitignore))

## Ignore files

- [`.gitignore`](.gitignore) — version control
- [`.cursorignore`](.cursorignore) — Cursor indexing (similar artifacts, keep `src/` and config files indexed)

Package-level `.cursorignore` files apply when a subfolder is opened as its own workspace.