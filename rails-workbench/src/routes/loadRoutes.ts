import { spawn } from 'node:child_process';
import * as vscode from 'vscode';
import { parseRoutesOutput } from './parseRoutesOutput';
import type { RouteIndex } from './routeTypes';

const CONFIG_COMMAND = 'routes.command';
const CONFIG_CWD = 'routes.workingDirectory';
const DEFAULT_COMMAND = 'bundle exec rails routes';
const LOAD_TIMEOUT_MS = 30_000;

function routesCommand(): string {
	return vscode.workspace
		.getConfiguration('rails-workbench')
		.get<string>(CONFIG_COMMAND, DEFAULT_COMMAND);
}

function routesWorkingDirectory(railsRoot: string): string {
	const configured = vscode.workspace
		.getConfiguration('rails-workbench')
		.get<string>(CONFIG_CWD, '')
		.trim();
	return configured.length > 0 ? configured : railsRoot;
}

export interface RoutesLoadResult {
	index: RouteIndex;
	stderr: string;
}

export function runRoutesCommand(
	railsRoot: string,
	signal?: AbortSignal,
): Promise<RoutesLoadResult> {
	const command = routesCommand();
	const cwd = routesWorkingDirectory(railsRoot);

	return new Promise((resolve) => {
		const child = spawn(command, {
			cwd,
			shell: true,
			env: { ...process.env },
		});

		let stdout = '';
		let stderr = '';
		let settled = false;

		const finish = (result: RoutesLoadResult): void => {
			if (settled) {
				return;
			}
			settled = true;
			clearTimeout(timeout);
			signal?.removeEventListener('abort', onAbort);
			resolve(result);
		};

		const timeout = setTimeout(() => {
			child.kill();
			finish({
				index: new Map(),
				stderr: `Timed out after ${LOAD_TIMEOUT_MS}ms: ${command}`,
			});
		}, LOAD_TIMEOUT_MS);

		const onAbort = (): void => {
			child.kill();
		};
		signal?.addEventListener('abort', onAbort);

		child.stdout?.on('data', (chunk: Buffer | string) => {
			stdout += chunk.toString();
		});
		child.stderr?.on('data', (chunk: Buffer | string) => {
			stderr += chunk.toString();
		});

		child.on('error', (error) => {
			finish({
				index: new Map(),
				stderr: error.message,
			});
		});

		child.on('close', (code) => {
			if (code !== 0) {
				finish({
					index: new Map(),
					stderr: stderr || `Exit code ${code ?? 'unknown'}`,
				});
				return;
			}
			finish({
				index: parseRoutesOutput(stdout),
				stderr: stderr.trim(),
			});
		});
	});
}

export async function loadRoutesWithProgress(
	railsRoot: string,
	signal?: AbortSignal,
): Promise<RoutesLoadResult> {
	return vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Window,
			title: 'Loading Rails routes',
			cancellable: true,
		},
		async (_progress, token) => {
			const combined = new AbortController();
			token.onCancellationRequested(() => combined.abort());
			signal?.addEventListener('abort', () => combined.abort());
			return runRoutesCommand(railsRoot, combined.signal);
		},
	);
}
