# Whisper STT - Local Speech-to-Text

A production-quality, offline-capable, browser-based Speech-to-Text web application powered by whisper.cpp WebAssembly. All audio processing happens locally in your browser - no data leaves your device.

## Features

- **Real-time Dictation** - Live microphone transcription with partial/final stabilization
- **Batch Transcription** - Upload audio files (WAV/MP3/M4A/OGG/WebM/FLAC) or record clips
- **Fully Local** - All inference runs in-browser via WebAssembly. No server uploads.
- **Multi-language** - Supports 90+ languages with auto-detection
- **Export** - TXT, JSON, SRT, VTT formats with timestamps
- **Transcript Editor** - Edit, search, and copy transcripts
- **History** - Optionally save transcripts locally (IndexedDB)
- **Dark/Light Mode** - System-aware theme with manual toggle
- **Model Management** - Load from file or download, with IndexedDB caching
- **Responsive** - Desktop-first with mobile bottom navigation

## Quick Start

### Prerequisites

- Node.js 18+
- A whisper.cpp GGML model file (`.bin`)

### Install & Run

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` with COOP/COEP headers enabled by default.

### Get a Model

Download a whisper.cpp model in GGML format:

```bash
# Tiny model (~75 MB) - fastest, good for testing
curl -L -o ggml-tiny.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin

# Base model (~142 MB) - balanced
curl -L -o ggml-base.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin

# Small model (~466 MB) - best accuracy
curl -L -o ggml-small.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
```

Or download directly from the app's Settings page.

### Load Model & Transcribe

1. Open the app in Chrome/Edge (Firefox/Safari may have limited WebAssembly support)
2. Click **"Load from File"** in the sidebar or Settings, and select your `.bin` model
3. Navigate to **Dictation** for live mic transcription, or **Batch** to upload a file
4. Export results as TXT, JSON, SRT, or VTT

## Building WASM Assets

This project expects whisper.cpp WASM build artifacts. To build from source:

```bash
# Clone whisper.cpp
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp

# Build WASM (requires Emscripten)
mkdir build-wasm && cd build-wasm
emcmake cmake .. -DWHISPER_WASM=ON
make -j$(nproc)

# Copy artifacts to public/wasm/
cp bin/whisper.wasm ../../public/wasm/
cp bin/stream.wasm ../../public/wasm/
```

> **Note**: The app includes a simulation mode that works without actual WASM binaries, demonstrating the full pipeline. Replace the simulation in `src/worker/whisper-worker.ts` with actual WASM loading for production use.

## COOP/COEP Headers

Multi-threaded WebAssembly requires `SharedArrayBuffer`, which needs these HTTP headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Development

Already configured in `vite.config.ts` - works out of the box with `npm run dev`.

### Production (Nginx)

```nginx
location / {
    add_header Cross-Origin-Opener-Policy "same-origin";
    add_header Cross-Origin-Embedder-Policy "require-corp";
    try_files $uri $uri/ /index.html;
}
```

### Production (Apache)

```apache
<IfModule mod_headers.c>
    Header set Cross-Origin-Opener-Policy "same-origin"
    Header set Cross-Origin-Embedder-Policy "require-corp"
</IfModule>
```

### Production (Cloudflare Pages / Vercel)

Add a `_headers` file:

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

The app detects `crossOriginIsolated` and shows a warning if headers are missing. It still works in single-threaded mode.

## Project Structure

```
src/
├── audio/              # Audio capture and processing
│   ├── capture.ts      # Mic capture (AudioWorklet) + clip recorder
│   ├── resample.ts     # Decode & resample to 16kHz mono
│   ├── vad.ts          # Energy-based Voice Activity Detection
│   └── worklet-processor.ts  # AudioWorkletProcessor (runs in audio thread)
├── components/
│   ├── layout/         # Sidebar, mobile nav
│   ├── model/          # Model picker with cache management
│   ├── transcript/     # Transcript panel, export menu
│   └── ui/             # Button, StatusChip, ProgressBar, Toast, AudioMeter
├── hooks/
│   └── use-whisper-worker.ts  # Worker communication hook
├── lib/
│   ├── db.ts           # IndexedDB (models + transcripts)
│   ├── export.ts       # TXT/JSON/SRT/VTT export generators
│   └── utils.ts        # Formatting, cn(), timestamps
├── pages/
│   ├── dictation.tsx   # Real-time mic dictation
│   ├── batch.tsx       # File upload / record + batch transcribe
│   ├── history.tsx     # Transcript history viewer
│   ├── settings.tsx    # All settings (model, theme, VAD, threads)
│   └── about.tsx       # App info + browser compatibility
├── stores/
│   └── app-store.ts    # Zustand global state
├── types/
│   └── index.ts        # TypeScript types + constants
├── worker/
│   └── whisper-worker.ts  # Web Worker for WASM inference
└── __tests__/
    ├── export.test.ts  # Export format tests
    └── utils.test.ts   # Utility function tests
```

## Worker Messaging Contract

### Main -> Worker

```typescript
// Initialize model
{ type: "init", modelData: ArrayBuffer, modelId: string, options: { language?, task?, threads? } }

// Batch transcribe
{ type: "transcribe", pcm_f32: Float32Array, sample_rate_hz: 16000 }

// Stream audio frames
{ type: "audio", frames: AudioFrame[] }

// Abort current operation
{ type: "abort" }
```

### Worker -> Main

```typescript
// Status updates
{ type: "status", state: "loading"|"ready"|"running"|"error", detail?: string }

// Partial results (streaming)
{ type: "partial", text: string, t0_ms?: number, t1_ms?: number }

// Final results
{ type: "final", text: string, segments?: TranscriptSegment[] }

// Loading progress
{ type: "progress", loaded: number, total: number }
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with COOP/COEP headers |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |

## Testing

### Unit Tests

```bash
npm test
```

Tests cover export formatting (SRT/VTT timestamps, JSON structure) and utility functions.

### Manual Integration Test Plan

1. **Model Loading**
   - [ ] Load model from local `.bin` file
   - [ ] Model shows "Ready" status
   - [ ] Model is cached in IndexedDB
   - [ ] Reload page, load from cache
   - [ ] Clear cache works

2. **Batch Transcription**
   - [ ] Upload WAV file -> transcript appears
   - [ ] Upload MP3 file -> transcript appears
   - [ ] Record clip -> stop -> transcript appears
   - [ ] Export TXT, JSON, SRT, VTT
   - [ ] Error on unsupported format shows toast

3. **Real-time Dictation**
   - [ ] Click mic -> permission dialog
   - [ ] Speaking shows audio level meter
   - [ ] Partial text appears while speaking
   - [ ] Stop dictation cleans up
   - [ ] Presentation mode works

4. **UI/UX**
   - [ ] Dark/light/system theme toggle
   - [ ] Sidebar navigation
   - [ ] Mobile responsive layout
   - [ ] Toasts appear for errors/success
   - [ ] History saves and loads transcripts

## Browser Compatibility

| Feature | Chrome 90+ | Edge 90+ | Firefox 90+ | Safari 15.4+ |
|---------|-----------|---------|-------------|-------------|
| WebAssembly | Yes | Yes | Yes | Yes |
| AudioWorklet | Yes | Yes | Yes | Yes |
| SharedArrayBuffer | Yes* | Yes* | Yes* | Yes* |
| MediaRecorder | Yes | Yes | Yes | Yes |

*Requires COOP/COEP headers

## Tech Stack

- **Vite** + **React 19** + **TypeScript**
- **TailwindCSS v4** for styling
- **Zustand** for state management
- **idb** for IndexedDB access
- **lucide-react** for icons
- **react-router-dom** for routing
- **Web Workers** for off-thread inference
- **AudioWorklet** for low-latency audio capture

## Demo Checklist

1. Open the app at `http://localhost:5173`
2. Load a model (Settings -> Load from File, pick `ggml-tiny.bin`)
3. Wait for "Ready" status
4. **Batch**: Go to Batch Transcribe, upload a WAV/MP3, see transcript + segments
5. **Stream**: Go to Dictation, click mic, speak, see live text
6. **Export**: Click download icon, export as SRT
7. **History**: Save transcript, navigate to History, view it
8. **Theme**: Toggle dark/light mode via sidebar

## License

MIT
