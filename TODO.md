# LD PicU TODO

## AI Coding Rules

- Complete one unchecked task at a time after its dependencies are available.
- Keep changes scoped to the active task.
- Run relevant verification before checking off a task.
- Preserve platform acceptance tasks until they are manually tested on the named desktop OS.

## Phase 1: Foundation

- [x] T01 Scaffold Electron, Vite, and TypeScript project
- [x] T02 Configure app metadata, scripts, and secure BrowserWindow defaults
- [x] T03 Define typed IPC contracts and the restricted preload API
- [x] T04 Add the single-instance lifecycle
- [x] T05 Add application and tray icon assets
- [x] T05a Generate application and tray assets from assets/icon.png

## Phase 2: Configuration

- [x] T06 Define configuration schema, defaults, and validation
- [x] T07 Persist configuration JSON atomically in Electron userData
- [x] T08 Restrict Linux configuration file permissions
- [x] T09 Build and connect the English settings dialog

## Phase 3: Upload Domain

- [x] T10 Generate date-based random object keys
- [x] T11 Normalize public URLs and format URL/Markdown output
- [x] T12 Classify and validate image inputs
- [x] T13 Convert static images to WebP with sharp
- [x] T14 Preserve GIF and existing WebP inputs
- [x] T15 Read clipboard images and encode PNG fallback
- [x] T16 Upload images through S3-compatible storage
- [x] T17 Orchestrate upload status, copying, retry, and notifications

## Phase 4: Interface and Tray

- [x] T18 Build the main drag-and-drop upload interface
- [x] T19 Add preview, states, errors, and result actions
- [x] T20 Implement tray menu and close-to-tray behavior
- [x] T21 Add tray clipboard uploads and system notifications
- [x] T21a Keep the latest successful upload result visible until cleared or replaced
- [x] T21b Add explicit raw URL and Markdown copy actions

## Phase 5: Quality and Distribution

- [x] T22 Add unit tests for pure upload-domain utilities
- [x] T23 Add configuration and image processing tests
- [x] T24 Configure Windows and Linux packages
- [x] T25 Add GitHub Actions test, build, artifact, and release workflow
- [x] T26 Verify typecheck, tests, and production build

## Phase 6: Manual Platform Acceptance

- [ ] T27 Verify drag, clipboard, tray, and notifications on Windows 11
- [ ] T28 Verify drag, clipboard, tray, and notifications on Linux Mint
- [ ] T29 Verify a real Cloudflare R2 upload with production credentials
- [ ] T30 Complete the acceptance criteria in docs/requirements.md
