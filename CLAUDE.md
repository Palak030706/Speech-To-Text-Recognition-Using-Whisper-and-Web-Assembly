# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Browser-based speech-to-text using Whisper ONNX models via `@huggingface/transformers`. All inference runs locally in a Web Worker — no audio leaves the device.

## Commands

```bash
npm run dev          # Dev server (port 5174, NOT 5173) — serves COOP/COEP headers
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
npm run preview      # Preview production build
```

## Architecture

### Data Flow

```
Mic → MediaRecorder (5s timeslice) → Blob chunks → decode to 16kHz PCM → Web Worker → ONNX Whisper → text + segments
```

### Key Layers

- **`src/audio/capture.ts`** — `StreamCapture` class handles mic access, MediaRecorder chunking, 16kHz decoding, and AnalyserNode for level meter. `ClipRecorder` is a simpler recorder for batch mode.
- **`src/worker/whisper-worker.ts`** — Dedicated Web Worker running `@huggingface/transformers` ASR pipeline. Messages: `init` (load model), `transcribe` (run inference), `abort`.
- **`src/hooks/use-whisper-worker.ts`** — Singleton Worker with reference counting. All components share one worker instance; terminated only when last consumer unmounts.
- **`src/stores/app-store.ts`** — Zustand store for all global state (worker status, model state, transcription results, settings). Settings persisted to localStorage.
- **`src/lib/db.ts`** — IndexedDB via `idb` for model cache and transcript history.
- **`src/lib/export.ts`** — Export generators for TXT, JSON, SRT, VTT formats.
- **`src/pages/`** — Dictation (real-time mic), Batch (file upload), History, Settings, About.

### Critical Audio Patterns

**Never create `new AudioContext({ sampleRate: 16000 })` for live mic capture.** Chrome delivers zero-filled buffers when the requested sample rate doesn't match the mic's native rate (typically 48kHz). Only use 16kHz AudioContext for offline decoding (`decodeAudioData`).

The `StreamCapture` class uses two separate audio paths:
1. **Native-rate AudioContext + AnalyserNode** — for real-time audio level visualization
2. **16kHz AudioContext for `decodeAudioData`** — to produce PCM for Whisper

Delta tracking (`lastDecodedSamples`) ensures only new audio is sent to the worker, not the full accumulated buffer.

### Worker Message Protocol

Main → Worker: `init { modelId }`, `transcribe { pcm_f32, sample_rate_hz }`, `abort`
Worker → Main: `status { state, detail }`, `progress { loaded, total }`, `partial { text }`, `final { text, segments }`

### Model Mapping

Model IDs (`tiny`, `base`, `small`, plus `.en` variants) map to `onnx-community/whisper-*` HuggingFace repos. Models use `q8` quantization and `wasm` device.

### COOP/COEP Headers

SharedArrayBuffer (for multi-threaded ONNX) requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. Vite dev server sets these automatically. Production deployments must configure them on the web server.

### Path Alias

`@/*` maps to `./src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).

### React Strict Mode

Dev mode causes double mount/unmount cycles. The singleton worker uses ref counting to handle this — you'll see create→terminate→create cycles, but the final state is correct.
