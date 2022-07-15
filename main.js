const { app, BrowserWindow } = require('electron')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        minWidth: 800,
        height: 600,
        minHeight: 600,
        webPreferences: {
            scrollBounce: true,
            spellcheck: false,
        },
    })

    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:5173')
        win.webContents.openDevTools()
    } else {
        win.loadFile('dist/index.html')
    }
}
app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
