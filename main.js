const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("child_process");
const http = require('http');
const path = require("path");
const fs = require("fs");
const isDev = !app.isPackaged;

let mainWindow = null;
let backendProcess = null;
let isAppQuitting = false;
let isBackendStarting = false;

function startBackendServer() {
  if (backendProcess || isBackendStarting) {
    console.log("Backend server already running or starting");
    return;
  }
  
  isBackendStarting = true;

  const serverPath = isDev
    ? path.join(__dirname, "server.js")
    : path.join(process.resourcesPath, "app", "server.js");

  console.log("Starting backend server from:", serverPath);

  if (isDev) {
    backendProcess = spawn("node", [serverPath], {
      stdio: "inherit"
    });
  } else {
    backendProcess = spawn(process.execPath, [serverPath], {
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" }
    });
  }

  backendProcess.on("error", (error) => {
    console.error("Failed to start backend server:", error);
    dialog.showErrorBox("Backend Error", "Failed to start the backend server. Please restart the application.");
  });

  backendProcess.on("exit", (code) => {
    console.log(`Backend server exited with code ${code}`);
    if (!isAppQuitting) {
      dialog.showErrorBox("Backend Stopped", "The backend server has stopped. The application will now close.");
      isAppQuitting = true;
      app.quit();
    }
    backendProcess = null;
    isBackendStarting = false;
  });
}

// Health check with exponential backoff
function waitForBackend(maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const baseDelay = 500; // Starting delay in ms
    
    const check = () => {
      attempts++;
      if (attempts > maxAttempts) {
        reject(new Error(`Backend did not start after ${maxAttempts} attempts`));
        return;
      }
      
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/ping',
        method: 'GET',
        timeout: 2000
      };
      
      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retryWithBackoff();
        }
      });
      
      req.on('error', () => retryWithBackoff());
      req.end();
    };
    
    const retryWithBackoff = () => {
      const delay = baseDelay * Math.pow(2, attempts);
      console.log(`Backend not ready, retrying in ${delay}ms...`);
      setTimeout(check, delay);
    };
    
    check();
  });
}
let isCreatingWindow = false;

async function createWindow() {
  if (isCreatingWindow) {
    console.log("Window is already being created, skipping duplicate call");
    return;
  }

  isCreatingWindow = true;

  if (mainWindow) {
    console.log("Window already exists");
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    isCreatingWindow = false;
    return;
  }

  if (!backendProcess) {
    startBackendServer();
  }

  try {
    await waitForBackend();

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      }
    });


const startURL = isDev
      ? "http://localhost:3000"
      : "http://localhost:5000";

    console.log("Backend ready, loading URL:", startURL);
    await mainWindow.loadURL(startURL);

    mainWindow.once("ready-to-show", () => {
      mainWindow.show();
    });

    mainWindow.on("close", (event) => {
      if (!isAppQuitting) {
        event.preventDefault();
        dialog.showMessageBox(mainWindow, {
          type: 'question',
          buttons: ['Yes', 'No'],
          title: 'Confirm',
          message: 'Are you sure you want to quit?'
        }).then((result) => {
          if (result.response === 0) {
            isAppQuitting = true;
            app.quit();
          }
        });
      }
    });

    mainWindow.on("closed", () => {
      mainWindow = null;
      isCreatingWindow = false;
    });

  } catch (err) {
    console.error("Failed to start backend:", err.message);
    isAppQuitting = true;
    dialog.showErrorBox("Backend Startup Failed", "Backend server failed to start.");
    app.quit();
  } finally {
    isCreatingWindow = false;
  }
}

app.whenReady().then(createWindow).catch((err) => {
  console.error("Error during app startup:", err);
  dialog.showErrorBox("Startup Error", "An error occurred during application startup.");
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    isAppQuitting = true;
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
    }
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("before-quit", () => {
  isAppQuitting = true;
  if (backendProcess) {
    backendProcess.kill();
  }
});

process.on("SIGINT", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.quit();
});

process.on("SIGTERM", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.quit();
});
