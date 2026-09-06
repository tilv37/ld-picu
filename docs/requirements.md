# LD PicU Requirements

## Purpose

LD PicU is a small personal desktop image uploader for Windows 11 and Linux Mint. It uploads a single image to an S3-compatible object store such as Cloudflare R2, then copies a public URL to the clipboard.

The product favors a short, dependable upload path over broad PicGo-compatible features.

## Product Identity

| Field | Value |
| --- | --- |
| Product name | LD PicU |
| Package name | `ld-picu` |
| Application ID | `com.ld.picu` |
| Interface language | English |

## Technology

- Electron with TypeScript.
- The renderer uses native HTML, CSS, and TypeScript.
- The main process owns the tray, clipboard, file access, image conversion, configuration, and S3 upload.
- A context-isolated preload script exposes a narrow, typed IPC API.
- Node integration is disabled in the renderer.
- `sharp` converts static images to WebP.
- AWS SDK for JavaScript v3 uploads to S3-compatible storage.

## Supported Workflows

### File Drag and Drop

- The main window accepts exactly one local image at a time.
- Dropping a single supported image starts an upload immediately.
- Dropping multiple files, a directory, or an unsupported file displays an error and starts no upload.

### Clipboard Upload

- The user can select `Upload from Clipboard` from the main window or tray menu.
- The app reads the operating system current clipboard value only; clipboard history is not used.
- If the clipboard does not contain an image, the operation is skipped without an error notification.

### Image Processing

- Convert to WebP is a global setting and defaults to enabled.
- WebP quality is configurable from 1 to 100 and defaults to 82.
- PNG, JPEG, and other supported static raster images are converted to WebP when conversion is enabled.
- GIF files and already-WebP files are uploaded without re-encoding.
- With conversion disabled, dropped files retain their original bytes and extension.
- With conversion disabled, clipboard images are encoded as PNG.
- Converted images do not retain metadata such as EXIF.
- The MVP does not provide resizing, cropping, watermarks, animation conversion, or target-size compression.

### S3-Compatible Upload

The settings page contains:

- S3 endpoint
- Bucket
- Region, default `auto`
- Access key ID
- Secret access key
- Public URL prefix
- Force path-style addressing
- Convert to WebP
- WebP quality
- Copy format

Object keys use local date directories and a 16-character cryptographically random identifier:

```text
YYYY/MM/DD/<random-id>.<extension>
```

For example:

```text
2026/09/06/a1b2c3d4e5f6a7b8.webp
```

The upload sends the correct content type and does not set an ACL. The public result URL is the normalized public URL prefix followed by the object key.

### Results and Clipboard

- Every successful upload displays the final public URL and copies it automatically.
- Copy format defaults to plain URL and can be changed to Markdown image syntax.
- The result provides separate manual actions to copy the raw URL or Markdown image syntax, independent of the automatic copy setting.
- The most recent successful result remains visible for the current application session until it is replaced by a later successful upload or cleared manually.
- A failed later upload does not remove the most recent successful result.
- Clearing the result affects only the GUI; it does not modify the clipboard or delete the uploaded object.
- The most recent result is not restored after the application exits.
- Failed uploads do not replace the clipboard and can be retried from the main window.

### Tray and Window Lifecycle

- The application starts with the main window visible.
- Closing the main window hides it to the system tray instead of exiting the process.
- Left-clicking the tray icon restores and focuses the window.
- The tray context menu includes `Show LD PicU`, `Upload from Clipboard`, `Settings`, and `Quit`.
- Clipboard uploads triggered from the tray copy successful results and show a system notification.
- Failures triggered from the tray show a system notification.
- Only the explicit `Quit` action exits the application.

## Configuration and Security

- Configuration is persisted in JSON in Electron's `userData` directory.
- Access credentials are intentionally stored in plaintext for this personal-use MVP.
- On Linux, the configuration file should use permission mode `0600` where supported.
- Credentials never cross the preload IPC boundary and are never exposed to renderer JavaScript.

## Packaging

- Windows: installer package.
- Linux: AppImage and deb package.
- The application icon is sourced from `assets/icon.png`; generated `assets/app-icon.png` and `assets/tray-icon.png` serve runtime window and tray usage. Linux packages use standard hicolor sizes from `assets/linux-icons`.
- GitHub Actions builds and tests on Windows and Ubuntu, uploading packages as workflow artifacts.
- A version tag may create a GitHub Release containing those packages.

## Non-Goals

The first release excludes:

- Multiple-file uploads
- Upload history
- Global shortcuts
- Clipboard monitoring
- Launch at login
- Automatic updates
- User accounts
- Image resizing, cropping, watermarks, and compression targets

## Acceptance Criteria

- The app starts on Windows 11 and Linux Mint.
- A PNG or JPEG dropped in the window uploads to an S3-compatible store and converts to WebP when enabled.
- A GIF remains animated after upload.
- Clipboard images upload on demand; non-image clipboard data is skipped.
- The configured custom domain is used for the displayed and copied URL.
- Both plain URL and Markdown output copy formats work.
- Tray hiding, restoration, clipboard upload, success notifications, and explicit quit work.
- Failed uploads do not copy invalid values and can be retried.
- The configuration persists across restarts.
