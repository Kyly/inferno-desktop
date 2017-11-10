const { app, BrowserWindow, ipcMain } = require('electron');
const { flow } = require('lodash');
const settings = require('electron-settings');
const autoUpdater = require('electron-updater').autoUpdater;
const startService = require('./app/main/startService');
const path = require('path');
const url = require('url');
const fetch = require('node-fetch');
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

let win;

app.on('ready', flow([startService(), createWindow]));

app.on('window-all-closed', () => {

    const shutdownRequest = fetch('http://localhost:8080/shutdown', { method: 'POST' });

    if ( process.platform !== 'darwin' ) {
        shutdownRequest.then(app.quit)
            .catch(app.quit);

    }

});

app.on('activate', () => {
    if ( win === null ) {
        createWindow();
    }
});

ipcMain.on('setSchemaPath', async (event, opts) => {

    const resolvedPath = path.normalize(opts.path);
    event.sender.send('setSchemaPath.start', { path: resolvedPath });

    let response;

    try {
        response = await fetch('http://localhost:8080/data-model', {
            method: 'POST',
            body: JSON.stringify({ path: resolvedPath }),
            headers: { 'Content-Type': 'application/json'}
        });
    } catch (error) {
        event.sender.send('setSchemaPath.failure', { path: resolvedPath, reason: error.message });
        return;
    }

    if (!response.ok) {
        event.sender.send('setSchemaPath.failure', { path: resolvedPath, reason: response.statusText });
        return;
    }

    settings.set('schema.path', resolvedPath);
    event.sender.send('setSchemaPath.success', { path: resolvedPath });

});

function createWindow() {

    win = new BrowserWindow({ width: 1200, height: 1000 });

    win.loadURL(url.format({
        pathname: path.join(__dirname, '/app/renderer/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    win.on('closed', () => {
        win = null;
    });

    win.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        const popup = new BrowserWindow({ show: false });
        popup.once('ready-to-show', () => popup.show());
        popup.loadURL(url);
        event.newGuest = popup;
    });

}
