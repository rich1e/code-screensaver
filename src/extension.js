/*
 * @Author       : yuqigong@outlook.com
 * @Date         : 2026-01-15 19:00:13
 * @LastEditors  : yuqigong@outlook.com
 * @LastEditTime : 2026-01-17 15:21:03
 * @FilePath     : /vscode-matrix-overlay/src/extension.js
 * @Description  : 
 */
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

let panel = null;
let statusBarItem = null;

let immersiveState = {
  sidebarToggled: false,
  statusBarToggled: false,
  fullScreenToggled: false
};

function activate(context) {
  console.log("Matrix Overlay activated");

  const startCommand = vscode.commands.registerCommand(
    "matrixOverlay.start",
    async () => {
      if (panel) {
        panel.reveal();
        return;
      }

      await enterImmersiveMode();

      panel = vscode.window.createWebviewPanel(
        "matrixOverlay",
        "Matrix Overlay",
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );

      panel.onDidDispose(async () => {
        panel = null;
        updateStatusBar(false);
        await exitImmersiveMode();
      });

      panel.webview.html = getWebviewHtml(context, panel.webview);

      panel.webview.postMessage({
        type: "config",
        payload: getConfig()
      });

      panel.webview.onDidReceiveMessage((msg) => {
        if (msg.type === "close") {
          panel.dispose();
        }
      });

      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("matrixOverlay") && panel) {
          panel.webview.postMessage({
            type: "config",
            payload: getConfig()
          });
        }
      });

      updateStatusBar(true);
    }
  );

  // 状态栏
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "matrixOverlay.start";
  statusBarItem.text = "$(symbol-misc) Matrix";
  statusBarItem.tooltip = "Toggle Matrix Overlay";
  statusBarItem.show();

  context.subscriptions.push(startCommand, statusBarItem);
}

function deactivate() {
  if (panel) panel.dispose();
}

module.exports = {
  activate,
  deactivate
};

function updateStatusBar(active) {
  statusBarItem.text = active
    ? "$(debug-stop) Matrix"
    : "$(symbol-misc) Matrix";
}

function getWebviewHtml(context, webview) {
  const htmlPath = path.join(
    context.extensionPath,
    "src/webview/index.html"
  );
  let html = fs.readFileSync(htmlPath, "utf8");

  const scriptUri = webview.asWebviewUri(
    vscode.Uri.file(
      path.join(context.extensionPath, "src/webview/matrix.js")
    )
  );

  html = html.replace("{{SCRIPT_URI}}", scriptUri.toString());
  html = html.replace(/{{CSP_SOURCE}}/g, webview.cspSource);

  return html;
}

function getConfig() {
  const config = vscode.workspace.getConfiguration("matrixOverlay");
  return {
    opacity: config.get("opacity", 0.05),
    fps: config.get("fps", 30),
    fontSize: config.get("fontSize", 16)
  };
}

async function enterImmersiveMode() {
  immersiveState = {
    sidebarToggled: false,
    statusBarToggled: false,
    fullScreenToggled: false
  };

  // Sidebar：始终尝试隐藏，但记录“我是否动过”
  await vscode.commands.executeCommand(
    "workbench.action.toggleSidebarVisibility"
  );
  immersiveState.sidebarToggled = true;

  // Status Bar
  await vscode.commands.executeCommand(
    "workbench.action.closeSidebar"
  );
  immersiveState.statusBarToggled = true;

  // Fullscreen（可配置）
  const config = vscode.workspace.getConfiguration("matrixOverlay");
  if (config.get("immersiveFullScreen", false)) {
    if (!vscode.window.state.fullScreen) {
      await vscode.commands.executeCommand(
        "workbench.action.toggleFullScreen"
      );
      immersiveState.fullScreenToggled = true;
    }
  }
}

async function exitImmersiveMode() {
  if (immersiveState.sidebarToggled) {
    await vscode.commands.executeCommand(
      "workbench.action.openSidebar"
    );
  }

  if (immersiveState.statusBarToggled) {
    await vscode.commands.executeCommand(
      "workbench.action.toggleStatusbarVisibility"
    );
  }

  if (immersiveState.fullScreenToggled) {
    await vscode.commands.executeCommand(
      "workbench.action.toggleFullScreen"
    );
  }
}