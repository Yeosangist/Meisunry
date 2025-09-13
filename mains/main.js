const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { loadFolder, loadData, saveAppData, refreshGrid } = require('./main-functions');
const contextMenuJS = require('./context-menu');

// Helper: Check if file is an image
function isFileAnImage(fileName) {
  const isImagePattern = /\.(jpg|jpeg|png|gif|jfif|webp)$/i;
  return isImagePattern.test(fileName);
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    // ...window options...
  });

  // ...other window setup...

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('leave-full-screen'); 
  });

  // Handler for when folder is dropped
  ipcMain.on('folderDropped', (event, folder) => {
    // Normalize incoming path
    loadFolder(mainWindow, path.normalize(folder));
  });

  // Handler for when image is dropped. Relocates file from one folder to another.
  ipcMain.on('imageDropped', async (event, imagePath) => {
    // Normalize incoming path
    const normImagePath = path.normalize(imagePath);
    const destinationFilePath = path.join(
      path.normalize(global.preferencesData.folderLocation),
      path.basename(normImagePath)
    );

    if (fs.existsSync(destinationFilePath)) return;

    fs.rename(normImagePath, destinationFilePath, async (err) => {
      if (!err) {
        console.log(`Moved file to ${destinationFilePath}`);
        try {
          const stats = await fs.promises.stat(destinationFilePath);
          const fileDate = stats.mtime; // Modification date of the file
          const newImageFile = {
            name: path.basename(destinationFilePath),
            date: fileDate,
            fullPath: destinationFilePath,
            isImage: isFileAnImage(destinationFilePath),
          };
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

  // ...rest of the function...

  return mainWindow;
}

// Recursive file reading with robust path handling
ipcMain.handle('readFilesFromDisk', async (event, filePath) => {
  // Normalize incoming path
  const normalizedPath = path.normalize(filePath);
  const updatedFileList = [];
  try {
    await addFolderToList(normalizedPath, 0);
    
    async function addFolderToList(targetFolderPath, depth) {
      const files = await fs.promises.readdir(targetFolderPath);
      await pushFilteredFilesToList(files, targetFolderPath);
      depth++;
      if (depth <= global.preferencesData.recursion) {
        // Find directories
        const folders = files.filter(item => {
          const itemPath = path.join(targetFolderPath, item);
          return fs.statSync(itemPath).isDirectory();
        });
        for (const folderName of folders) {
          const nestedFolder = path.join(targetFolderPath, folderName);
          console.log(nestedFolder);
          await addFolderToList(nestedFolder, depth);
        }
      }
    }

    // Push filtered file group to final list 
    async function pushFilteredFilesToList(targetFiles, targetFilePath) {
      targetFiles = targetFiles.filter(file => file.match(/\.(jpg|jpeg|png|gif|jfif|webp|mp4|webm|mkv|avi|mov|wmv|flv|mts)$/i));
      for (const filename of targetFiles) {
        const fullFilePath = path.join(targetFilePath, filename);
        try {
          const stats = await fs.promises.stat(fullFilePath);
          const fileDate = stats.mtime;
          const isImage = isFileAnImage(filename);
          if ((isImage && !preferencesData.DisableImages) || (!isImage && !preferencesData.DisableVideos)) {
            updatedFileList.push({ name: filename, date: fileDate, fullPath: fullFilePath, isImage: isImage });
          }
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

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Export or run main logic
module.exports = {
  createWindow,
  isFileAnImage
};
