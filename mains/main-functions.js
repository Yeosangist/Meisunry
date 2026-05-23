const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

/* Save data to preferencesData */
function saveAppData() {
  const userDataPath = app.getPath('userData');
  const dataFilePath = path.join(userDataPath, 'appdata.json');
  const serializedData = JSON.stringify(global.preferencesData, null, 2);
  fs.writeFileSync(dataFilePath, serializedData);
}

/* Load preferencesData on disk */
function loadData() {
  const userDataPath = app.getPath('userData');
  const dataFilePath = path.join(userDataPath, 'appdata.json');

  try {
    const fileContents = fs.readFileSync(dataFilePath, 'utf-8');
    const loadedData = JSON.parse(fileContents);
    // Ensure the folder location uses the correct path separator
    if (loadedData.folderLocation) {
      loadedData.folderLocation = path.normalize(loadedData.folderLocation);
    }
    return loadedData;
  } catch (error) {
    /* Default json */
    const baseData = {
      folderLocation: process.platform === 'linux' ? path.join('file://', path.sep) : os.homedir(),
      sortMode: "date",
      recursion: 0,
      loadSpeed: 'medium',
      zoomLevel: 1.5,
      DisableImages: false,
      DisableVideos: false,
    }
    const serializedData = JSON.stringify(baseData, null, 2);
    fs.writeFileSync(dataFilePath, serializedData);
    console.log(`${error}`);
    return baseData;
  }
}

/* Load a folder from a path, save to preferencesData on disk, and refresh browser window */
function loadFolder (browserWindow, selectedFolderPath) {
  console.log('Selected folder:', selectedFolderPath);
  // Always normalize incoming paths
  global.preferencesData.folderLocation = path.normalize(selectedFolderPath);
  saveAppData();
  loadIndex(browserWindow);
}

/* Truncate a file path to the nearest folder */
function truncateFilePathToNearestFolder(filePath) {
  if (filePath === `./mains/main.js` || filePath.toLowerCase().includes("meisunry")) {
    return global.preferencesData.folderLocation;
  }

  // Use path.parse to handle paths in a platform-agnostic way
  const parsed = path.parse(filePath);

  // If it's a file (has an extension), return its directory
  if (parsed.ext) {
    return parsed.dir + path.sep;
  }

  // If it's already a directory, return it with trailing separator, using path.sep
  return filePath.endsWith(path.sep) ? filePath : filePath + path.sep;
}

function loadIndex(browserWindow) {
  const parentDir = path.join(__dirname, '..');
  browserWindow.loadURL(`file://${parentDir}/renderers/index.html`);
}

/**
 * Refresh the grid:
 * - Clears the existing list/grid in the renderer.
 * - Scans the current folder using current settings (recursion, sort, filters).
 * - Rebuilds the file array and sends it to the renderer.
 */
function refreshGrid(browserWindow) {
  // 1. Tell the renderer to clear the grid instantly
  browserWindow.webContents.send('clear-grid');

  // 2. Load the current folder path and settings
  const folderPath = global.preferencesData.folderLocation;
  const maxDepth = global.preferencesData.recursion || 0;
  const sortMode = global.preferencesData.sortMode || 'date';
  // Example: allowedFormats as an array of extensions, e.g. ['.jpg', '.png', ...]
  const allowedFormats = global.preferencesData.allowedFormats || [
    '.jpg', '.jpeg', '.png', '.gif', '.jfif', '.webp', '.mp4', '.webm', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.mts'
  ];

  // 3. Scan for files using current settings
  let fileList = [];
  function scanDir(currentPath, currentDepth) {
    if (currentDepth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch (err) {
      console.error("Error reading directory:", currentPath, err);
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath, currentDepth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (allowedFormats.includes(ext)) {
          try {
            const stats = fs.statSync(fullPath);
            fileList.push({
              name: entry.name,
              date: stats.mtime,
              fullPath,
              isImage: /\.(jpg|jpeg|png|gif|jfif|webp)$/i.test(entry.name),
            });
          } catch (err) {
            console.error("Error stating file:", fullPath, err);
          }
        }
      }
    }
  }
  scanDir(folderPath, 0);

  // 4. Sort the file list
  switch (sortMode) {
    case 'newest':
      fileList.sort((a, b) => b.date - a.date);
      break;
    case 'oldest':
      fileList.sort((a, b) => a.date - b.date);
      break;
    case 'name-a':
      fileList.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      break;
    case 'name-z':
      fileList.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: 'base' }));
      break;
    case 'type-a':
      fileList.sort((a, b) => {
        const extA = path.extname(a.name).toLowerCase();
        const extB = path.extname(b.name).toLowerCase();
        return extA.localeCompare(extB) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
      break;
    case 'type-z':
      fileList.sort((a, b) => {
        const extA = path.extname(a.name).toLowerCase();
        const extB = path.extname(b.name).toLowerCase();
        return extB.localeCompare(extA) || b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
      });
      break;
    case 'random':
      for (let i = fileList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fileList[i], fileList[j]] = [fileList[j], fileList[i]];
      }
      break;
    // default: date descending (newest)
    default:
      fileList.sort((a, b) => b.date - a.date);
  }

  // 5. Send the new file list to the renderer for rebuilding the grid
  browserWindow.webContents.send('refresh-grid-update', fileList);
}

module.exports = {
  saveAppData,
  truncateFilePathToNearestFolder,
  loadFolder,
  loadData,
  loadIndex,
  refreshGrid
};
