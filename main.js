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
    show: false, // Hide window until ready
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const startURL = app.isPackaged
    ? "http://localhost:5000" // Serve React via Express in production
    : "http://localhost:3000"; // Development mode

  console.log("🔹 Loading URL:", startURL);
  mainWindow.loadURL(startURL);

  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow.show();
  });

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    stopBackendProcess();
  });
}

function startBackend() {
  const isPackaged = app.isPackaged;
  const serverPath = isPackaged
    ? path.join(process.resourcesPath, "server.js")
    : path.join(__dirname, "server.js");

  if (fs.existsSync(serverPath)) {
    console.log(`✅ Starting backend server from: ${serverPath}`);
    backendProcess = spawn("node", [serverPath], {
      stdio: "ignore",
      detached: true,
    });
    backendProcess.unref();
  } else {
    console.error(`⚠️ ERROR: Backend server not found at ${serverPath}`);
  }
}

function startReactServer() {
  if (app.isPackaged) {
    const server = express();
    const buildPath = path.join(__dirname, "build");

    server.use(express.static(buildPath));

    server.get("*", (req, res) => {
      res.sendFile(path.join(buildPath, "index.html"));
    });

    server.listen(5000, () => {
      console.log("✅ React App is being served at http://localhost:5000");
    });
  }
}

function stopBackendProcess() {
  if (backendProcess) {
    backendProcess.kill();
    console.log("✅ Backend process killed.");
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
  if (mainWindow === null) createWindow();
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
