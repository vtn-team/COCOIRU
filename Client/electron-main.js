const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png') // アイコンがあれば設定
  });

  // HTMLファイルを読み込み
  mainWindow.loadFile('electron-renderer.html');

  // 開発者ツールを開く（デバッグ用）
  // mainWindow.webContents.openDevTools();

  // ウィンドウが閉じられた時の処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// アプリが準備完了になったらウィンドウを作成
app.whenReady().then(createWindow);

// すべてのウィンドウが閉じられた時の処理
app.on('window-all-closed', () => {
  // macOS以外では、すべてのウィンドウが閉じられたらアプリを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アプリがアクティブになった時の処理（macOS用）
app.on('activate', () => {
  // macOSでは、ウィンドウが閉じられてもアプリは残る
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});