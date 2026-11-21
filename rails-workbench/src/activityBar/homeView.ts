import * as vscode from 'vscode';
import { openLatestMigration } from '../migrations/openLatestMigration';

const VIEW_ID = 'rails-workbench.home';

function getNonce(): string {
	let text = '';
	const possible =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function homeViewHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
	const nonce = getNonce();
	const csp = [
		`default-src 'none'`,
		`style-src ${webview.cspSource} 'unsafe-inline'`,
		`script-src 'nonce-${nonce}'`,
	].join('; ');

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <title>Rails Workbench</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 0.75rem;
      line-height: 1.5;
      box-sizing: border-box;
    }
    h1 {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--vscode-descriptionForeground);
      margin: 0 0 0.75rem;
    }
    button {
      width: 100%;
      padding: 0.5rem 0.75rem;
      font-family: inherit;
      font-size: 0.85rem;
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
      border: none;
      border-radius: 2px;
      cursor: pointer;
      text-align: left;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    button:focus-visible {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <h1>Rails Workbench</h1>
  <button type="button" id="open-latest-migration">Open latest migration</button>
  <script nonce="${nonce}">
    (function () {
      const vscode = acquireVsCodeApi();
      document.getElementById('open-latest-migration').addEventListener('click', () => {
        vscode.postMessage({ type: 'openLatestMigration' });
      });
    })();
  </script>
</body>
</html>`;
}

class RailsWorkbenchHomeViewProvider implements vscode.WebviewViewProvider {
	constructor(private readonly extensionUri: vscode.Uri) {}

	resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	): void {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri],
		};
		webviewView.webview.html = homeViewHtml(
			webviewView.webview,
			this.extensionUri,
		);

		webviewView.webview.onDidReceiveMessage((message: { type?: string }) => {
			if (message.type === 'openLatestMigration') {
				void openLatestMigration();
			}
		});
	}
}

export function registerActivityBarHomeView(
	context: vscode.ExtensionContext,
): void {
	const provider = new RailsWorkbenchHomeViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(VIEW_ID, provider, {
			webviewOptions: {
				retainContextWhenHidden: true,
			},
		}),
	);
}