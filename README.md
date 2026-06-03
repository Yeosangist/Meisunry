# Cascade
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/Yeosangist/Cascade/Cascade-1.0.0.AppImage?displayAssetName=false&color=%2300aa00)<br>

A minimalist, offline masonry image viewer.

Masonry layouts are super common all over the web from websites like <a href="https://pinterest.com/">Pinterest</a>, <a href="https://www.artstation.com/">ArtStation</a>, or <a href="https://deviantart.com">DeviantArt</a>. In terms of offline masonry viewers, the options are more limited. There are some programs like <a href="https://apps.microsoft.com/store/detail/123-photos-view-edit-convert/9WZDNCRDXFXG?hl=en-us&gl=us&rtc=1">123 Photos</a> and <a href="https://apps.microsoft.com/store/detail/microsoft-photos/9WZDNCRFJBH4">Microsoft Photos</a>. However, both of these solutions have a bit too much in the way, and only work on Windows.

This is where <b>Cascade</b> comes in. Choose a folder and look at your images without any unnecessary details.

![Demo](/app-icons/demo.gif)

## Controls

<b>Left click:</b> Make target media fullscreen<br>
<b>Right click:</b> Settings like sort order, recursion depth, and folder select<br>
<b>Ctrl + F:</b> Choose another folder<br>
<b>Ctrl + Mouse wheel:</b> Zoom in/out<br>
<b>Shift + Mouse wheel:</b> Padding control<br>
<b>Esc:</b> Close fullscreen view

## Extra features
<b>Automatic reload</b>: Refreshes the grid when a setting is changed<br>
<b>Custom background colour</b>: Accessed from the right-click menu<br>
<b>Folder persistence</b>: Remembers chosen folder between sessions<br>
<b>Zoom persistence</b>: Remembers zoom level between sessions<br>
<b>Format filtering</b>: Toggle display of images and videos from right-click menu

## Notes
Doesn't handle loading 1000+ files very well. Try to keep it under 500.

## Installation

### Development
```bash
npm install
npm start
```

### Building
```bash
npm run package
```

### Linux Desktop Integration
To integrate Cascade with your file manager (enable "Open with Cascade" context menu):

1. Install the application first using `npm run package` or `npm run make`
2. Copy the desktop file to system applications:
```bash
sudo cp cascade.desktop /usr/share/applications/
```
3. Copy the icon to system icons:
```bash
sudo cp app-icons/logo.png /usr/share/icons/hicolor/256x256/apps/Cascade.png
```
4. Update desktop database:
```bash
sudo update-desktop-database /usr/share/applications/
```

After installation, you can:
- Right-click folders or supported image/video files and select "Open with Cascade"
- Set Cascade as the default viewer for supported file types
- Launch Cascade from your application menu
