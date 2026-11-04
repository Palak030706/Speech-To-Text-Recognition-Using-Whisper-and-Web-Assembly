import { useState, useEffect, useCallback } from 'react'
import { getAllTranscripts, deleteTranscript, clearTranscripts } from '@/lib/db'
import type { TranscriptEntry } from '@/types'
import { TranscriptPanel } from '@/components/transcript/transcript-panel'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app-store'
import { formatDuration } from '@/lib/utils'
import { Trash2, Clock, Mic, FileAudio, ChevronRight, ArrowLeft } from 'lucide-react'

export function HistoryPage() {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([])
  const [selected, setSelected] = useState<TranscriptEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const { settings, addToast } = useAppStore()

  const loadTranscripts = useCallback(async () => {
    setLoading(true)
    try {
      const all = await getAllTranscripts()
      setTranscripts(all.slice(0, settings.maxHistoryItems))
    } catch {
      addToast('Failed to load history', 'error')
    }
    setLoading(false)
  }, [settings.maxHistoryItems, addToast])

  useEffect(() => {
    loadTranscripts()
  }, [loadTranscripts])

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      await deleteTranscript(id)
      if (selected?.id === id) setSelected(null)
      await loadTranscripts()
      addToast('Transcript deleted', 'info')
    },
    [selected, loadTranscripts, addToast],
  )

  const handleClearAll = useCallback(async () => {
    await clearTranscripts()
    setTranscripts([])
    setSelected(null)
    addToast('History cleared', 'info')
  }, [addToast])

  if (!settings.historyEnabled) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          History Disabled
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Enable transcript history in Settings to save and review past transcriptions.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {selected && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSelected(null)}
              aria-label="Back to list"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selected ? 'Viewing transcript' : `${transcripts.length} transcripts saved`}
            </p>
          </div>
        </div>
        {!selected && transcripts.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            <Trash2 className="h-3.5 w-3.5" />
            Clear All
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="p-6 max-w-3xl mx-auto">
            <TranscriptPanel
              text={selected.text}
              segments={selected.segments}
              mode={selected.mode}
              modelId={selected.modelId}
              language={selected.language}
            />
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        ) : transcripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
              No transcripts yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Transcripts will appear here after you save them.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {transcripts.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="w-full flex items-center gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-700 shrink-0">
                  {t.mode === 'dictation' ? (
                    <Mic className="h-4 w-4 text-blue-500" />
                  ) : (
                    <FileAudio className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {t.text.slice(0, 100) || '(empty)'}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(t.createdAt).toLocaleString()}</span>
                    <span className="capitalize">{t.mode}</span>
                    <span>{t.modelId}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(t.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all cursor-pointer"
                  aria-label="Delete transcript"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
