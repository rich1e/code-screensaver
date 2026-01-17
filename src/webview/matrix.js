/*
 * @Author       : yuqigong@outlook.com
 * @Date         : 2026-01-17 14:02:45
 * @LastEditors  : yuqigong@outlook.com
 * @LastEditTime : 2026-01-17 14:36:15
 * @FilePath     : /vscode-matrix-overlay/src/webview/matrix.js
 * @Description  : 
 */
const vscode = acquireVsCodeApi();

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const chars =
  "アイウエオカキクケコサシスセソ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

let columns = 0;
let drops = [];
let lastTime = 0;

let fontSize = 16;
let fps = 30;
let opacity = 0.05;
let frameDuration = 1000 / fps;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  columns = Math.floor(canvas.width / fontSize);
  drops = Array(columns).fill(1);
}

function draw() {
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
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

function loop(time) {
  if (time - lastTime > frameDuration) {
    draw();
    lastTime = time;
  }
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(loop);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    vscode.postMessage({ type: "close" });
  }
});

window.addEventListener("message", (event) => {
  const message = event.data;

  if (message.type === "config") {
    const { opacity: o, fps: f, fontSize: fs } = message.payload;

    if (typeof o === "number") opacity = o;
    if (typeof f === "number") {
      fps = f;
      frameDuration = 1000 / fps;
    }
    if (typeof fs === "number") {
      fontSize = fs;
      resize();
    }
  }
});