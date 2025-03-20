const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Client, Authenticator } = require('minecraft-launcher-core');

let mainWindow;
let minecraftProcess = null;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 500,
        resizable: false,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWindow.loadFile('index.html');
    mainWindow.setMenuBarVisibility(false);
    //mainWindow.webContents.openDevTools();
});

// Buscar ejecutable de Java
function findJavaExecutable() {
    const isWindows = process.platform === 'win32';
    const javaExecutable = isWindows ? 'javaw.exe' : 'java';
    const javaHome = process.env.JAVA_HOME;
    return javaHome ? path.join(javaHome, 'bin', javaExecutable) : javaExecutable;
}

// Escuchar solicitud para iniciar Minecraft
ipcMain.handle('start-minecraft', async (_, perfil) => {
    if (minecraftProcess) {
        return { success: false, error: 'Minecraft is already running.' };
    }

    const launcher = new Client();
    const options = {
        authorization: Authenticator.getAuth(perfil.username),
        root: path.join(app.getPath('documents'), '.minecraft'),
        version: { number: perfil.version, type: 'release' },
        memory: { max: perfil.ram, min: '512' },
        javaPath: findJavaExecutable(),
    };

    try {
        minecraftProcess = await launcher.launch(options);

        launcher.on('data', (e) => {
            if (e.includes('Launching')) {
                mainWindow.webContents.send('minecraft-status', 'Starting...');
            }
        });
        launcher.on('progress', (e) => {
            const progress = Math.round((e.task / e.total) * 100);
            mainWindow.webContents.send('minecraft-status', `Downloading... ${progress}%`);
        });
        launcher.on('close', () => {
            minecraftProcess = null;
            mainWindow.webContents.send('minecraft-status', 'closed');
        });

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Cerrar la aplicación
ipcMain.handle('close-app', () => app.quit());

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});