const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const isDev = require('electron-is-dev');
const settings = require('electron-settings');
const autoUpdater = require('electron-updater').autoUpdater;
const InfernoService = require('./app/main/service/InfernoService');
const ServiceConfiguration = require('./app/main/service/ServiceConfiguration');
const path = require('path');
const url = require('url');

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

let mainWindow;
let service;

app.on('ready', () => {

    mainWindow = createWindow();

    // Needed to allow copy paste on mac
    if ( process.platform === 'darwin' ) {
        createMenu();
    }

    ServiceConfiguration.create({ isDev, settings })
        .then(InfernoService.start)
        .then(instance => {
            service = instance;
            mainWindow.webContents.on('did-finish-load', () => {
                mainWindow.webContents.send('serviceInfo.schemaPath', { path: service.configuration.schemaPath });
            });
        });


});

app.on('window-all-closed', () => {
    if ( process.platform !== 'darwin' ) {
        app.quit();
    }
});

app.on('quit', () => {
    service.stop();
});

app.on('activate', () => {
    if ( mainWindow === null ) {
        mainWindow = createWindow();
    }
});

ipcMain.on('setSchemaPath', async (event, opts) => {

    const resolvedPath = path.normalize(opts.path);
    event.sender.send('setSchemaPath.start', { path: resolvedPath });

    let response;

    try {
        response = await service.setSchemaPath(resolvedPath);
    } catch (error) {
        event.sender.send('setSchemaPath.failure', { path: resolvedPath, reason: error.message });
        return;
    }

    if ( !response.ok ) {
        event.sender.send('setSchemaPath.failure', { path: resolvedPath, reason: response.statusText });
        return;
    }

    settings.set('schema.path', resolvedPath);
    event.sender.send('setSchemaPath.success', { path: resolvedPath });

});

function createWindow() {

    let win = new BrowserWindow({ width: 1200, height: 1000 });

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

    return win;

}

function createMenu() {

    const application = {
        label: 'Application',
        submenu: [
            {
                label: 'About Application',
                selector: 'orderFrontStandardAboutPanel:'
            },
            {
                type: 'separator'
            },
            {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: () => {
                    app.quit();
                }
            }
        ]
    };

    const edit = {
        label: 'Edit',
        submenu: [
            {
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                selector: 'undo:'
            },
            {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                selector: 'redo:'
            },
            {
                type: 'separator'
            },
            {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                selector: 'cut:'
            },
            {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                selector: 'copy:'
            },
            {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                selector: 'paste:'
            },
            {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                selector: 'selectAll:'
            }
        ]
    };

    const template = [
        application,
        edit
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

}