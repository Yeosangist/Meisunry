Getting weird blank spaces in your grid because the media is getting registered but not showing? It might be in a weird format, like a video with an HE-AACv2 aac audio profile. If that's the case, try converting the video codec.

## Supported Image Types
| Image Format       | Support in Electron | Notes / Caveats                                  |
|-------------------|---------------------------|------------------------------------------------|
| PNG               | ✅ Full support           | Lossless, widely used                           |
| JPEG / JPG        | ✅ Full support           | Lossy, standard for photos                      |
| GIF               | ✅ Full support           | Includes animation                              |
| SVG               | ✅ Full support           | Vector format, scalable                          |
| WebP              | ✅ Full support           | Modern, smaller file sizes                       |
| BMP               | ✅ Full support           | Rarely used, uncompressed                        |
| TIFF              | ⚠️ Partial / Requires library | Not natively rendered in Chromium            |
| HEIC / HEIF       | ⚠️ Depends on OS         | macOS/iOS may work, Windows often needs codec  |
| RAW (CR2, NEF, etc.) | ❌ Not supported       | Needs conversion to standard format first       |
| ICO / CUR         | ⚠️ Limited support       | Mainly for favicons or cursors, not general images |



## Supported video codecs
| Codec / Container     | Support in Electron | Notes / Caveats                                                  |
| --------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| **Audio**             |                                    |                                                                  |
| AAC (LC)              | ✅ Good                             | Best supported, safe choice                                      |
| HE-AAC / HE-AACv2     | ⚠️ Often fails                     | High-efficiency profiles not guaranteed; may require re-encoding |
| ALAC (Apple Lossless) | ❌ Poor                             | Rarely supported natively                                        |
| FLAC                  | ⚠️ Sometimes                       | Depends on Chromium build                                        |
| WMA / ATRAC           | ❌ Poor                             | Proprietary; almost never supported                              |
| Opus                  | ⚠️ Usually                         | Works in WebM/Ogg; may fail in MP4 containers                    |
| MP3                   | ✅ Good                             | Very widely supported                                            |
| **Video**             |                                    |                                                                  |
| H.264                 | ✅ Good                             | Default safe choice                                              |
| HEVC / H.265          | ⚠️ Often fails                     | Requires extra libs or Chromium build with HEVC support          |
| VP8                   | ✅ Good                             | Usually works in WebM                                            |
| VP9                   | ⚠️ Sometimes                       | Newer builds only; hardware acceleration optional                |
| AV1                   | ⚠️ Limited                         | Very new; may fail on older Electron versions                    |
| MPEG-2 / VC-1         | ❌ Poor                             | Proprietary, not supported                                       |
| ProRes / DNxHD        | ❌ Poor                             | Mostly for MOV; Electron won’t decode                            |
| **Containers**        |                                    |                                                                  |
| MP4                   | ✅ Good                             | Safe, widely compatible                                          |
| WebM                  | ✅ Good                             | Works with VP8/VP9 + Opus                                        |
| MKV                   | ⚠️ Sometimes                       | Exotic audio/video tracks can break playback                     |
| MOV                   | ⚠️ Sometimes                       | Depends on codec inside; ProRes often fails                      |
| FLV / RM              | ❌ Poor                             | Not supported natively                                           |
