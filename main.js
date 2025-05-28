// main.js
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

  const startURL = "http://localhost:5000";

  mainWindow.loadURL(startURL);

  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow.show();
  });

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("❌ Failed to load URL:", errorDescription);
  });

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    stopBackendProcess();
    mainWindow = null;
  });
}

function startBackend() {
  const isPackaged = app.isPackaged;
  const serverPath = isPackaged
    ? path.join(process.resourcesPath, "server.js")
    : path.join(__dirname, "server.js");

  const backendPort = 5000;

  if (fs.existsSync(serverPath)) {
    console.log(`✅ Starting backend: ${serverPath} on port ${backendPort}`);

    backendProcess = spawn("node", [serverPath], {
      shell: true,
      env: { ...process.env, PORT: backendPort.toString() },
    });

    backendProcess.stdout.on("data", (data) => {
      console.log("📦 Backend:", data.toString());
    });

    backendProcess.stderr.on("data", (data) => {
      console.error("❌ Backend Error:", data.toString());
    });

    backendProcess.on("exit", (code) => {
      console.log("🚪 Backend exited with code:", code);
    });

    backendProcess.unref();
  } else {
    console.error(`❌ server.js not found at ${serverPath}`);
  }
}

function stopBackendProcess() {
  if (backendProcess) {
    backendProcess.kill();
    console.log("✅ Backend process stopped.");
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

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
