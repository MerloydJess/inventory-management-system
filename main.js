// main.js
const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

let mainWindow;
let backendProcess;

// ✅ Create main app window
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

  const startURL = "http://localhost:5000"; // Same port as Express

  mainWindow.loadURL(startURL);

  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow.show();
  });

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    stopBackendProcess();
    mainWindow = null;
  });
}

// ✅ Start Express backend
function startBackend() {
  const isPackaged = app.isPackaged;
  const serverPath = isPackaged
    ? path.join(process.resourcesPath, "app", "server.js")
    : path.join(__dirname, "server.js");

  const backendPort = 5000;

  if (fs.existsSync(serverPath)) {
    console.log(`✅ Starting backend: ${serverPath} on port ${backendPort}`);
    backendProcess = spawn("node", [serverPath], {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, PORT: backendPort.toString() },
    });
    backendProcess.unref();
  } else {
    console.error(`❌ server.js not found at ${serverPath}`);
  }
}

// ✅ Stop backend when app quits
function stopBackendProcess() {
  if (backendProcess) {
    backendProcess.kill();
    console.log("✅ Backend process stopped.");
  }
}

// ✅ Entry point
app.whenReady().then(() => {
  startBackend();
  createWindow();
});

// ✅ Cleanup on all closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopBackendProcess();
    app.quit();
  }
});

// ✅ macOS activate
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ✅ Ensure single instance
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
