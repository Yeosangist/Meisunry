// When you click down and release quick enough, exit full screen focus
let downTime;
focusImgVideoWrapper.onmousedown = (e) => {
  downTime = performance.now();
};
focusImgVideoWrapper.onmouseup = (e) => {
  if (performance.now() - downTime < 150) hideFocusImg();
};

// Exit full screen button
backButton.addEventListener('click', () => {
  hideFocusImg();
});


// Reset image pan/size button
resetFocusImgButton.addEventListener('click', () => {
  resetPanZoom(focusImg.naturalWidth, focusImg.naturalHeight);
});

// Pause/resume
focusVideo.addEventListener('click', () => {
  // focusVideo.resume
});

// Keyboard navigation in full-screen mode
document.addEventListener('keydown', (e) => {
  if (!focusImgVideoWrapper.classList.contains('show')) return;

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    navigateToNextImage();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    navigateToPreviousImage();
  } else if (e.key === 'c' || e.key === 'C') {
    e.preventDefault();
    centerAndResetZoom();
  }
});

function centerAndResetZoom() {
  if (focusImg.classList.contains('show')) {
    // Reset image zoom
    if (focusImg.naturalWidth) {
      resetPanZoom(focusImg.naturalWidth, focusImg.naturalHeight);
    }
  } else if (focusVideo.classList.contains('show')) {
    // Reset video zoom - use video dimensions
    if (focusVideo.videoWidth && focusVideo.videoHeight) {
      resetPanZoom(focusVideo.videoWidth, focusVideo.videoHeight);
    }
  }
}

function navigateToNextImage() {
  if (!allFiles || allFiles.length === 0) return;

  // Find current image index
  const currentSrc = focusImg.src || focusVideo.querySelector('source').src;
  const currentIndex = allFiles.findIndex(file => {
    const imgPath = encodeFilePath(file.fullPath);
    return currentSrc.includes(imgPath);
  });

  if (currentIndex === -1) return;

  const nextIndex = (currentIndex + 1) % allFiles.length;
  showImageAtIndex(nextIndex);
}

function navigateToPreviousImage() {
  if (!allFiles || allFiles.length === 0) return;

  // Find current image index
  const currentSrc = focusImg.src || focusVideo.querySelector('source').src;
  const currentIndex = allFiles.findIndex(file => {
    const imgPath = encodeFilePath(file.fullPath);
    return currentSrc.includes(imgPath);
  });

  if (currentIndex === -1) return;

  const prevIndex = (currentIndex - 1 + allFiles.length) % allFiles.length;
  showImageAtIndex(prevIndex);
}

function showImageAtIndex(index) {
  const file = allFiles[index];
  if (!file) return;

  const imgPath = encodeFilePath(file.fullPath);

  // Dispose existing panZoom instance
  if (panZoomInstance) {
    panZoomInstance.dispose();
  }

  // Reset zoomPanHolder transform
  zoomPanHolder.style.transformOrigin = `0px 0px 0px`;
  zoomPanHolder.style.transform = `inherit`;

  if (file.isImage) {
    // Show image
    focusVideo.querySelector('source').src = '';
    focusVideo.load();
    focusImg.src = imgPath;
    focusImg.classList.add('show');
    focusVideo.classList.remove('show');
    muteButtonFocus.classList.add('hide');

    // Create new panZoom instance for image
    setTimeout(() => {
      panZoomInstance = panzoom(zoomPanHolder);
      if (focusImg.naturalWidth) {
        resetPanZoom(focusImg.naturalWidth, focusImg.naturalHeight);
      }
    }, 100);
  } else {
    // Show video
    focusImg.src = '';
    focusImg.classList.remove('show');
    focusVideo.querySelector('source').src = imgPath;
    focusVideo.load();
    focusVideo.classList.add('show');
    muteButtonFocus.classList.remove('hide');

    // Sync mute state
    focusVideo.muted = true;
    muteButtonFocus.classList.remove('unmute');

    // Create new panZoom instance for video
    setTimeout(() => {
      panZoomInstance = panzoom(zoomPanHolder);
      if (focusVideo.videoWidth && focusVideo.videoHeight) {
        resetPanZoom(focusVideo.videoWidth, focusVideo.videoHeight);
      }
    }, 100);
  }

  // Store reference for grid video resumption
  focusVideo.dataset.gridVideoId = imgPath;
}

function resetPanZoom(elemWid, elemHei) {
  extraTopPadding = header.classList.contains('full-screen') ? 0 : 100;
  const screenSize = {
    "w": Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
    "h": Math.max(document.documentElement.clientHeight, window.innerHeight || 0)-extraTopPadding
  };
  let initalZoom = Math.min(screenSize.w / elemWid, screenSize.h / elemHei);
  //console.log(`img: ${elemWid} x ${elemHei} screenSize: ${screenSize.w} x ${screenSize.h} zoom: ${initalZoom}` );
  panZoomInstance.zoomAbs(0, 0, initalZoom);
  panZoomInstance.moveTo((screenSize.w - elemWid * initalZoom) / 2, (screenSize.h - elemHei * initalZoom) / 2);
}

muteButtonFocus.addEventListener('click', () => {
  focusVideo.muted = !focusVideo.muted;
  if (focusVideo.muted) muteButtonFocus.classList.remove(`unmute`);
  else muteButtonFocus.classList.add(`unmute`);
});

function hideFocusImg() {
  // Hide overlay
  panZoomInstance.dispose();
  focusImg.classList.remove('show');
  focusImgVideoWrapper.classList.remove('show');

  // Resume grid video playback
  const gridVideoId = focusVideo.dataset.gridVideoId;
  if (gridVideoId) {
    const sourceElement = document.getElementById(gridVideoId);
    if (sourceElement) {
      const gridVideo = sourceElement.parentNode;
      if (gridVideo && gridVideo.tagName === 'VIDEO') {
        gridVideo.currentTime = focusVideo.currentTime;
        gridVideo.muted = focusVideo.muted;
        gridVideo.play().catch(err => console.error('Error resuming video:', err));
        
        // Update mute button state
        const audioButton = gridVideo.parentNode.querySelector('a.audio-button');
        if (audioButton) {
          if (gridVideo.muted) audioButton.classList.remove(`unmute`);
          else audioButton.classList.add(`unmute`);
        }
      }
    }
  }

  // Hide full screen buttons
  backButton.classList.add(`hide`);
  muteButtonFocus.classList.add(`hide`);
  resetFocusImgButton.classList.add(`hide`);

  focusVideo.querySelector('source').src = ``;
  focusVideo.muted = true;
  focusVideo.load();
  delete focusVideo.dataset.gridVideoId;
  
  // Clear text selection
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  } else if (document.selection) { // For older versions of IE
    document.selection.empty();
  }
}

window.electronAPI.onHideFocusImg((event, value) => { hideFocusImg(); });
