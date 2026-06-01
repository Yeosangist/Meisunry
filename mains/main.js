const { app, BrowserWindow, ipcMain, globalShortcut, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { loadFolder, saveAppData, truncateFilePathToNearestFolder, loadData, loadIndex } = require('./main-functions');

global.preferencesData = loadData();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: 'app-icons/logo.png',
    webPreferences: {
      nodeIntegration: true,
      audio: true,
      zoomFactor: 0.01,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: false,
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(.01); 
  });

  loadIndex(mainWindow);

  // Handle setting and persisting background color
  ipcMain.on('set-bg-color', (event, color) => {
    // Persist color in preferencesData
    global.preferencesData.backgroundColor = color;
    saveAppData();
    mainWindow.webContents.send('update-bg-color', color);
  });

  // When renderer loads/reloads, send the saved background color (if any)
  ipcMain.handle('get-bg-color', () => {
    return global.preferencesData.backgroundColor || null;
  });

  // Handle setting and persisting zoom level
  ipcMain.on('set-zoom-level', (event, zoomLevel) => {
    global.preferencesData.zoomLevel = zoomLevel;
    saveAppData();
  });

  // When renderer loads/reloads, send the saved zoom level (if any)
  ipcMain.handle('get-zoom-level', () => {
    return global.preferencesData.zoomLevel || 1.5;
  });

  // Functions for handling window min/max/close 
  ipcMain.on('closeApp', () => {
    app.quit();
  });
  ipcMain.on('minimizeApp', () => {
    mainWindow.minimize();
  });
  ipcMain.on('maximizeApp', () => {
    if (mainWindow.isMaximized())
      mainWindow.restore();
    else
      mainWindow.maximize();
  });
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('enter-full-screen'); 
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('leave-full-screen'); 
  });

  // Handler for when folder is dropped 
  ipcMain.on('folderDropped', (event, folder) => {
    // Normalize incoming path for robustness
    loadFolder(mainWindow, path.normalize(folder));
  });

  // Handler for when image is dropped. Relocates file from one folder to another. 
  ipcMain.on('imageDropped', async (event, imagePath) => {
    // Normalize all incoming paths
    const normalizedImagePath = path.normalize(imagePath);
    const destFolder = path.normalize(global.preferencesData.folderLocation);
    const destinationFilePath = path.join(destFolder, path.basename(normalizedImagePath));

    if (fs.existsSync(destinationFilePath)) return;

    fs.rename(normalizedImagePath, destinationFilePath, async (err) => {
      if (!err) {
        console.log(`Moved file to ${destinationFilePath}`);
        try {
          const stats = await fs.promises.stat(destinationFilePath);
          const fileDate = stats.mtime; // Modification date of the file
          const newImageFile = { name: path.basename(destinationFilePath), date: fileDate, fullPath: destinationFilePath, isImage: isFileAnImage(destinationFilePath), };
          mainWindow.webContents.send('added-file', newImageFile); 
        } catch (error) {
          console.error(`Error reading file: ${destinationFilePath}`);
        }
      } else {
        console.log(`Move file error ${err}`);
      }
    });
  });

  ipcMain.handle('getIsFullscreen', () => {
    return mainWindow.isFullScreen();
  });

  return mainWindow;
}

app.whenReady().then(() => {

  // Access command-line arguments using process.argv
  const args = process.argv;
  const lastArg = args[args.length - 1];

  if (lastArg && !lastArg.includes('main.js')) {
    // Check if the path exists
    fs.access(lastArg, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`The path ${lastArg} does not exist.`);
      } else {
        // Check if it's a file or directory
        fs.stat(lastArg, (statErr, stats) => {
          if (statErr) {
            console.error(`Error stating path ${lastArg}:`, statErr);
            return;
          }

          // Always normalize for cross-platform compatibility
          const convertedPath = path.normalize(lastArg);

          if (stats.isDirectory()) {
            // It's a folder, set it as the folder location
            global.preferencesData.folderLocation = convertedPath;
            saveAppData();
          } else if (stats.isFile()) {
            // It's a file, get its parent directory
            const parentDir = path.dirname(convertedPath);
            global.preferencesData.folderLocation = parentDir;
            saveAppData();
          }
        });
      }
    });
  }

  var browserWindow = createWindow();

  globalShortcut.register('Escape', () => {
    browserWindow.webContents.send('hide-focus-img');
  });

  globalShortcut.register('CommandOrControl+F', () => {
    const options = {
      title: 'Select a Folder',
      properties: ['openDirectory'],
      defaultPath: global.preferencesData.folderLocation,
    };
    dialog.showOpenDialog(browserWindow, options)
      .then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
          loadFolder(browserWindow, result.filePaths[0]);
        }
      })
      .catch(err => {
        console.error('Error opening folder dialog:', err);
      });
  });

  ipcMain.handle('loadAppData', () => {
    return loadData();
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

ipcMain.handle('readFilesFromDisk', async (event, filePath) => {
  // Normalize file path
  const normalizedFilePath = path.normalize(filePath);
  const updatedFileList = [];
  try {
    await addFolderToList(normalizedFilePath, 0);
    
    async function addFolderToList(targetFolderPath, depth) {
      // Add contents of current folder to final list
      const files = await fs.promises.readdir(targetFolderPath);
      await pushFilteredFilesToList(files, targetFolderPath);
      // If our depth allows it, scan the current folder and recurse
      depth++;
      if (depth <= global.preferencesData.recursion)
      {
        // Find directories
        const folders = files.filter(item => {
          const itemPath = path.join(targetFolderPath, item);
          return fs.statSync(itemPath).isDirectory();
        });

        for (const folder of folders) {
          const nestedFolder = path.join(targetFolderPath, folder);
          console.log(nestedFolder);
          await addFolderToList(nestedFolder, depth);
        }
      }
    }

    // Push filtered file group to final list 
    async function pushFilteredFilesToList(targetFiles, targetFilePath) {
      targetFiles = targetFiles.filter(file => file.match(/\.(jpg|jpeg|png|avif|gif|jfif|webp|mp4|webm|mkv|avi|mov|wmv|flv|mts)$/i));
      for (const filename of targetFiles) {
        const fullFilePath = path.join(targetFilePath, filename);
        try {
          const stats = await fs.promises.stat(fullFilePath);
          const fileDate = stats.mtime; // Modification date of the file
          const isImage = isFileAnImage(filename);
          if ((isImage && !preferencesData.DisableImages) || (!isImage && !preferencesData.DisableVideos))
            updatedFileList.push({ name: filename, date: fileDate, fullPath: fullFilePath, isImage: isImage });
        } catch (error) {
          console.error(`Error reading file: ${filename}`);
        }
      }
    }

    // Sorting the fileList array by date
    updatedFileList.sort((a, b) => b.date - a.date);
    return updatedFileList;
  } catch (error) {
    throw error;
  }
});

// Close when window-all-closed 
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// When the app is about to quit, unregister all shortcuts
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

function isFileAnImage(fileName) {
  const isImagePattern = /\.(jpg|jpeg|png|gif|avif|jfif|webp)$/i;
  return isImagePattern.test(fileName);
}

const contextMenuJS = require('./context-menu');
