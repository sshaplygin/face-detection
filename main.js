const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const url = require('url');


let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({width: 784, height: 580});

  mainWindow.loadURL("file://" + __dirname + "/index.html");

  mainWindow.on('closed', function () {
    mainWindow = null;
  })
}

app.on('ready', ()=>{
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
