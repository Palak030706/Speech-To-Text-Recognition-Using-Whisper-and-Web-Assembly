import { useAppStore, applyTheme } from '@/stores/app-store'
import { LANGUAGES, type AppSettings } from '@/types'
import { ModelPicker } from '@/components/model/model-picker'
import { Button } from '@/components/ui/button'
import { isCrossOriginIsolated, getOptimalThreads } from '@/lib/utils'
import {
  Settings as SettingsIcon,
  Mic,
  Globe,
  Cpu,
  Database,
  Shield,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'

export function SettingsPage() {
  const { settings, updateSettings } = useAppStore()

  const handleTheme = (theme: AppSettings['theme']) => {
    updateSettings({ theme })
    applyTheme(theme)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Settings
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure transcription and application preferences
          </p>
        </div>

        {/* Model section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Database className="h-4 w-4" />
            Model
          </h3>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <ModelPicker />
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Appearance
          </h3>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light' as const, icon: Sun, label: 'Light' },
                { value: 'dark' as const, icon: Moon, label: 'Dark' },
                { value: 'system' as const, icon: Monitor, label: 'System' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => handleTheme(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg px-3 py-3 text-xs font-medium transition-colors border cursor-pointer ${
                    settings.theme === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Language & Task */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Language & Task
          </h3>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
            {/* Language */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Task */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Task
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateSettings({ task: 'transcribe' })}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors border cursor-pointer ${
                    settings.task === 'transcribe'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  Transcribe
                </button>
                <button
                  onClick={() => updateSettings({ task: 'translate' })}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors border cursor-pointer ${
                    settings.task === 'translate'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  Translate to English
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Performance */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Performance
          </h3>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
            {/* Cross-origin isolation status */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Multi-threading
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {isCrossOriginIsolated()
                    ? 'SharedArrayBuffer available'
                    : 'Requires COOP/COEP headers'}
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  isCrossOriginIsolated()
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                }`}
              >
                {isCrossOriginIsolated() ? 'Enabled' : 'Unavailable'}
              </span>
            </div>

            {/* Threads */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Threads: {settings.autoThreads ? `Auto (${getOptimalThreads()})` : settings.threads}
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoThreads}
                    onChange={(e) => updateSettings({ autoThreads: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  Auto
                </label>
              </div>
              {!settings.autoThreads && (
                <input
                  type="range"
                  min={1}
                  max={navigator.hardwareConcurrency || 8}
                  value={settings.threads}
                  onChange={(e) => updateSettings({ threads: parseInt(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              )}
            </div>
          </div>
        </section>

        {/* Audio / VAD */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Audio & VAD
          </h3>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
            {/* VAD enabled */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Voice Activity Detection
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Skip silent frames during dictation
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.vadEnabled}
                  onChange={(e) => updateSettings({ vadEnabled: e.target.checked })}
                  className="sr-only"
                />
                <div
                  className={`w-9 h-5 rounded-full transition-colors ${
                    settings.vadEnabled
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                      settings.vadEnabled ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>
            </div>

            {/* VAD threshold */}
            {settings.vadEnabled && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  VAD Threshold: {settings.vadThreshold.toFixed(3)}
                </label>
                <input
                  type="range"
                  min={0.001}
                  max={0.1}
                  step={0.001}
                  value={settings.vadThreshold}
                  onChange={(e) => updateSettings({ vadThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>Sensitive</span>
                  <span>Less sensitive</span>
                </div>
              </div>
            )}

            {/* Chunk duration */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Chunk Duration: {settings.chunkDuration.toFixed(1)}s
              </label>
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.1}
                value={settings.chunkDuration}
                onChange={(e) => updateSettings({ chunkDuration: parseFloat(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </section>

        {/* History */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy & History
          </h3>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Save History
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Store transcripts locally in your browser
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.historyEnabled}
                  onChange={(e) => updateSettings({ historyEnabled: e.target.checked })}
                  className="sr-only"
                />
                <div
                  className={`w-9 h-5 rounded-full transition-colors ${
                    settings.historyEnabled
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                      settings.historyEnabled ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2">
              All audio processing happens locally in your browser. No audio data is sent to any server. Models and transcripts are stored in IndexedDB.
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
