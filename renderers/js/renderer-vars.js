// Constants
const ipcRend = window.ipcRenderer;
const imageGrid = document.getElementById('imageGrid');
const focusImg = document.getElementById('img-focus');
const focusVideo = document.getElementById('video-focus');
const focusImgVideoWrapper = document.getElementById('img-focus-wrapper');
const muteButtonFocus = document.getElementById('mute-button-focus');
const zoomPanHolder = document.getElementById('zoomPanHolder');
const backButton = document.getElementById('back-button-focus');
const resetFocusImgButton = document.getElementById('reset-button-focus');
const gridWrapper = document.getElementById('grid-wrapper');
const donePopUp = document.getElementById(`done-pop-up`);
const loadIcon = document.getElementById(`load-icon`);

// Zoom and pan controls
let panZoomInstance = panzoom(zoomPanHolder);
panZoomInstance.dispose();

// Grid zoom / padding
currentZoom = 1.5;
currentPadding = .98;

// Load saved zoom level
window.electronAPI.getZoomLevel().then(zoomLevel => {
  if (zoomLevel) {
    currentZoom = zoomLevel;
  }
});

let grid;
let allFiles;
let resortAfterImageLoad;
