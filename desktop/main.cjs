"use strict";
const {app,BrowserWindow,shell,session} = require("electron");
const path = require("node:path");
const {createDesktopServer} = require("./server.cjs");

const APP_ID = "com.rihabalkhaliliyya.desktop";
app.setAppUserModelId(APP_ID);
const singleInstance = app.requestSingleInstanceLock();
let window = null;
let offlineServer = null;
let localOrigin = "";

function allowExternal(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" &&
      (parsed.hostname === "www.facebook.com" || parsed.hostname === "facebook.com");
  } catch { return false; }
}
async function openExternalIfApproved(url) {
  if (allowExternal(url)) await shell.openExternal(url);
}
function isLocal(url) {
  try { return new URL(url).origin === localOrigin; } catch { return false; }
}

async function startApplication() {
  const root = app.isPackaged
    ? path.join(process.resourcesPath, "web")
    : path.resolve(__dirname, "../dist-mobile");
  const started = await createDesktopServer(root);
  offlineServer = started.server;
  localOrigin = new URL(started.url).origin;
  session.defaultSession.setPermissionRequestHandler((_webContents,_permission,callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  window = new BrowserWindow({
    width: 1260, height: 840, minWidth: 780, minHeight: 570,
    show: false, autoHideMenuBar: true, backgroundColor: "#19392e",
    title: "رحاب الخليلية",
    icon: path.join(__dirname,"assets","rihab.ico"),
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: false,
    },
  });
  window.once("ready-to-show", () => window?.show());
  window.webContents.setWindowOpenHandler(({url}) => {
    void openExternalIfApproved(url);
    return {action:"deny"};
  });
  window.webContents.on("will-navigate", (event,url) => {
    if (!isLocal(url)) {event.preventDefault();void openExternalIfApproved(url);}
  });
  // Ctrl+mouse-wheel is handled by the PDF/book viewport.
  // Browser-wide keyboard zoom is offered for users with reduced vision.
  window.webContents.on("before-input-event", (event,input) => {
    if (!input.control || input.alt || input.type !== "keyDown") return;
    const plus = input.key === "+" || input.key === "=" || input.key === "Add";
    const minus = input.key === "-" || input.key === "Subtract";
    const reset = input.key === "0";
    if (!plus && !minus && !reset) return;
    event.preventDefault();
    const current = window?.webContents.getZoomFactor() ?? 1;
    window?.webContents.setZoomFactor(reset ? 1 : Math.max(.75,Math.min(2.5,current + (plus ? .1 : -.1))));
  });
  await window.loadURL(started.url);
}
if (!singleInstance) {
  app.quit();
} else {
  app.on("second-instance", () => { if (window) {if(window.isMinimized())window.restore();window.focus();} });
  app.whenReady().then(startApplication).catch(error => {
    console.error("Cannot start Rihab offline desktop library:",error);
    app.quit();
  });
  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", () => {if (offlineServer) offlineServer.close();});
}
