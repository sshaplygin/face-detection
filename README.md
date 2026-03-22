# Face Detection

Desktop application for real-time face detection on a webcam stream, built with Electron, Svelte 5, Rust and OpenCV.

The renderer captures RGBA frames from the camera, sends them to the main process via IPC, where a Rust native module (NAPI-RS) runs Haar cascade face detection with OpenCV and draws bounding boxes. Processed frames are rendered back on a canvas. Video recording to WebM is also supported.

## Prerequisites

- **Node.js** >= 20
- **Rust** stable toolchain
- **OpenCV 4** development libraries
- **libclang** (required by the `opencv` Rust crate)

### macOS

```bash
brew install opencv llvm pkg-config
```

### Ubuntu / Debian

```bash
sudo apt-get install -y libopencv-dev libclang-dev pkg-config
```

## Getting Started

```bash
git clone https://github.com/sshaplygin/face-detection.git
cd face-detection
npm install
npm run dev
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Build native module (debug) and start electron-vite dev server |
| `npm run build` | Build native module (release) and bundle the Electron app |
| `npm run pack` | Build and package into a directory (no installer) |
| `npm run dist` | Build and create a distributable installer |
| `npm run build:native` | Build the Rust native module (debug) |
| `npm run build:native:release` | Build the Rust native module (release, with LTO) |
| `npm run typecheck` | Run svelte-check TypeScript validation |

## Architecture

```text
src/
  main/index.ts        # Electron main process — loads native .node binary, handles IPC
  preload/index.ts      # Context bridge between main and renderer
  renderer/
    App.svelte          # Svelte 5 UI — camera control, frame loop, recording
    main.ts             # Renderer entry point
native/
  src/lib.rs            # Rust NAPI module — Haar cascade face detection via OpenCV
  Cargo.toml            # Rust dependencies (opencv, napi, once_cell)
  data/                 # Haar cascade XML classifier
```

## CI

GitHub Actions runs on every push/PR to `master`:

- **Frontend** — `npm ci` + `npm run typecheck`
- **Rust** — `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo build`, `cargo test`

## Tech Stack

- [Electron](https://www.electronjs.org/) 34 — desktop shell
- [Svelte](https://svelte.dev/) 5 — renderer UI
- [electron-vite](https://electron-vite.org/) — build tooling
- [NAPI-RS](https://napi.rs/) — Rust ↔ Node.js bridge
- [OpenCV](https://opencv.org/) (Rust bindings) — face detection with Haar cascades

## License

[MIT](LICENSE.md) — Sam Shaplygin
