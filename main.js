const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const isDev = !app.isPackaged;
  const startURL = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "build", "index.html")}`;

  mainWindow.loadURL(startURL);

  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow.show();
  });

  mainWindow.webContents.on("did-fail-load", (_, code, desc) => {
    console.error("❌ Failed to load window:", code, desc);
  });

  if (isDev) mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    stopBackendProcess();
    mainWindow = null;
  });
}

function startBackend() {
  const isDev = !app.isPackaged;
  const serverPath = isDev
    ? path.join(__dirname, "server.js")
    : path.join(process.resourcesPath, "server.js");

  if (!fs.existsSync(serverPath)) {
    console.error("❌ server.js not found at", serverPath);
    return;
  }

  console.log("⚙️ Starting backend from", serverPath);

  backendProcess = spawn("node", [serverPath], {
    shell: true,
    env: { ...process.env, PORT: "5000" },
  });

  backendProcess.stdout.on("data", (data) =>
    console.log("📦 Backend:", data.toString())
  );

  backendProcess.stderr.on("data", (data) =>
    console.error("❌ Backend Error:", data.toString())
  );

  backendProcess.on("exit", (code) =>
    console.log("🚪 Backend exited with code:", code)
  );

  backendProcess.unref();
}

function stopBackendProcess() {
  if (backendProcess) {
    backendProcess.kill();
    console.log("🛑 Backend process killed.");
  }
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopBackendProcess();
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
