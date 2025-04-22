const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const express = require("express");

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

  const backendPort = isPackaged ? 4000 : 5000;

  if (fs.existsSync(serverPath)) {
    console.log(`✅ Starting backend server from: ${serverPath} on port ${backendPort}`);
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

function startReactServer() {
  if (app.isPackaged) {
    const server = express();
    const buildPath = path.join(process.resourcesPath, "app", "build");

    server.use(express.static(buildPath));
    server.get("*", (req, res) => {
      res.sendFile(path.join(buildPath, "index.html"));
    });

    server.listen(5000, () => {
      console.log("✅ Express serving React at http://localhost:5000");
    });
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
  startReactServer();
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
