const vscode = require('vscode')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const disposable = vscode.commands.registerCommand(
    'matrixOverlay.start',
    () => {
      const panel = vscode.window.createWebviewPanel(
        'matrixOverlay',
        'Matrix Overlay',
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      )

      panel.webview.html = getHtml()

      // ESC 关闭（WebView -> Extension）
      panel.webview.onDidReceiveMessage((msg) => {
        if (msg.type === 'close') {
          panel.dispose()
        }
      })
    }
  )

  context.subscriptions.push(disposable)
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
}

function getHtml() {
  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Matrix Overlay</title>
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: black;
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
  canvas {
    display: block;
  }
  .hint {
    position: fixed;
    bottom: 12px;
    right: 16px;
    color: rgba(0,255,0,0.6);
    font-family: monospace;
    font-size: 12px;
  }
</style>
</head>
<body>
<canvas id="canvas"></canvas>
<div class="hint">Press ESC to exit</div>

<script>
  const vscode = acquireVsCodeApi();
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const chars = "アイウエオカキクケコサシスセソ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const fontSize = 16;
  let columns;
  let drops;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
  }

  function draw() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0F0";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  resize();
  window.addEventListener("resize", resize);

  let running = true;
  function loop() {
    if (!running) return;
    draw();
    requestAnimationFrame(loop);
  }
  loop();

  // ESC 退出
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      running = false;
      vscode.postMessage({ type: "close" });
    }
  });
</script>
</body>
</html>
`
}
