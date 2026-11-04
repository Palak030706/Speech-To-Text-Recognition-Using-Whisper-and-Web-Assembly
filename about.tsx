import { isCrossOriginIsolated } from '@/lib/utils'
import {
  AudioWaveform,
  Shield,
  Cpu,
  Globe,
  Github,
  ExternalLink,
  Check,
  X,
} from 'lucide-react'

export function AboutPage() {
  const features = [
    { name: 'WebAssembly', supported: typeof WebAssembly !== 'undefined' },
    { name: 'AudioWorklet', supported: typeof AudioWorkletNode !== 'undefined' },
    { name: 'Web Workers', supported: typeof Worker !== 'undefined' },
    { name: 'getUserMedia', supported: !!navigator.mediaDevices?.getUserMedia },
    { name: 'IndexedDB', supported: !!window.indexedDB },
    { name: 'SharedArrayBuffer', supported: isCrossOriginIsolated() },
    { name: 'MediaRecorder', supported: typeof MediaRecorder !== 'undefined' },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
              <AudioWaveform className="h-8 w-8" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Whisper STT</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Local, Privacy-Preserving Speech-to-Text
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center">
            <Shield className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Private</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All audio stays on your device. No server uploads.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center">
            <Cpu className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Fast</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              WebAssembly-powered inference. Runs entirely in your browser.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center">
            <Globe className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Multilingual</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supports 90+ languages with auto-detection.
            </p>
          </div>
        </div>

        {/* Browser Compatibility */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Browser Compatibility
          </h3>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">{feature.name}</span>
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${
                    feature.supported
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {feature.supported ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Supported
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5" /> Not Available
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            How It Works
          </h3>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
                  1
                </span>
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Load a model</strong> - Choose a whisper.cpp model (tiny, base, or small) and load it from a local file or download it.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
                  2
                </span>
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Provide audio</strong> - Upload a file, record a clip, or start live dictation from your microphone.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
                  3
                </span>
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Get your transcript</strong> - The model processes audio locally using WebAssembly. Edit, copy, or export the result.
                </span>
              </li>
            </ol>
          </div>
        </section>

        {/* Credits */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Credits
          </h3>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Powered by{' '}
              <strong className="text-gray-900 dark:text-gray-100">whisper.cpp</strong> by
              Georgi Gerganov - a high-performance C/C++ implementation of OpenAI's Whisper
              model, compiled to WebAssembly.
            </p>
            <p>
              Built with React, TypeScript, TailwindCSS, and Web APIs (AudioWorklet,
              WebAssembly, IndexedDB).
            </p>
          </div>
        </section>

        <div className="text-center text-xs text-gray-400 dark:text-gray-500 pb-8">
          Version 1.0.0
        </div>
      </div>
    </div>
  )
}
