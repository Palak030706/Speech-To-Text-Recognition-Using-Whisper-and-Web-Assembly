import { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useWhisperWorker } from '@/hooks/use-whisper-worker'
import { StreamCapture } from '@/audio/capture'
import { TranscriptPanel } from '@/components/transcript/transcript-panel'
import { AudioMeter } from '@/components/ui/audio-meter'
import { Button } from '@/components/ui/button'
import { AlertBanner } from '@/components/ui/status-chip'
import { ModelPicker } from '@/components/model/model-picker'
import { Mic, MicOff, Trash2, Save, Maximize2, Minimize2 } from 'lucide-react'

export function DictationPage() {
  const {
    modelLoaded,
    workerState,
    streamText,
    streamPartial,
    streamSegments,
    isStreaming,
    setIsStreaming,
    clearStreamText,
    settings,
    addToast,
    saveCurrentTranscript,
  } = useAppStore()

  const { transcribe, abort } = useWhisperWorker()
  const captureRef = useRef<StreamCapture | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [presentationMode, setPresentationMode] = useState(false)

  const handleStartStreaming = useCallback(async () => {
    console.log('[STT:Dictation] Start clicked. modelLoaded=%s, workerState=%s', modelLoaded, workerState)
    if (!modelLoaded) {
      addToast('Please load a model first', 'warning')
      return
    }
    if (workerState !== 'ready') {
      addToast('Model is not ready yet', 'warning')
      return
    }

    try {
      const capture = new StreamCapture({
        intervalMs: settings.chunkDuration * 1000, // Use chunk duration setting
        onAudioReady: (pcm) => {
          console.log('[STT:Dictation] onAudioReady: %d samples (%.1fs)', pcm.length, pcm.length / 16000)
          // Send full accumulated PCM to worker for transcription
          transcribe(pcm)
        },
        onLevel: (level) => {
          setAudioLevel(level)
        },
        onError: (err) => {
          console.error('[STT:Dictation] Capture error:', err.message)
          addToast(err.message, 'error')
        },
      })

      console.log('[STT:Dictation] Calling capture.start()...')
      await capture.start()
      console.log('[STT:Dictation] capture.start() succeeded')
      captureRef.current = capture
      setIsStreaming(true)
      addToast('Listening...', 'info', 2000)
    } catch (err) {
      console.error('[STT:Dictation] Failed to start:', err)
      addToast(
        err instanceof Error ? err.message : 'Failed to start microphone',
        'error',
      )
    }
  }, [modelLoaded, workerState, settings.chunkDuration, transcribe, setIsStreaming, addToast])

  const handleStopStreaming = useCallback(async () => {
    console.log('[STT:Dictation] Stop clicked.')
    if (captureRef.current) {
      await captureRef.current.stop()
      captureRef.current = null
    }
    abort()
    setIsStreaming(false)
    setAudioLevel(0)
    addToast('Dictation stopped', 'info', 2000)
  }, [abort, setIsStreaming, addToast])

  const handleSave = useCallback(async () => {
    await saveCurrentTranscript('dictation')
    addToast('Transcript saved to history', 'success')
  }, [saveCurrentTranscript, addToast])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (captureRef.current) {
        captureRef.current.stop()
      }
    }
  }, [])

  const hasText = streamText.trim().length > 0 || streamPartial.length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Real-time Dictation
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Speak into your microphone for live transcription
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasText && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setPresentationMode(!presentationMode)}
                aria-label={presentationMode ? 'Exit presentation mode' : 'Enter presentation mode'}
              >
                {presentationMode ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleSave}
                aria-label="Save to history"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={clearStreamText}
                aria-label="Clear transcript"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Model not loaded warning */}
          <AlertBanner show={!modelLoaded}>
            <strong>No model loaded.</strong> Load a whisper model using the sidebar to get started.
          </AlertBanner>

          {/* Mic control */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <button
                onClick={isStreaming ? handleStopStreaming : handleStartStreaming}
                disabled={!modelLoaded || workerState === 'loading'}
                className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isStreaming
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25'
                }`}
                aria-label={isStreaming ? 'Stop dictation' : 'Start dictation'}
              >
                {isStreaming ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
                {isStreaming && (
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
                )}
              </button>
            </div>

            {/* Audio level meter */}
            {isStreaming && <AudioMeter level={audioLevel} className="w-40" />}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {!modelLoaded
                ? 'Load a model to begin'
                : isStreaming
                  ? 'Listening... Click to stop'
                  : 'Click to start dictation'}
            </p>
          </div>

          {/* Presentation mode - large text overlay */}
          {presentationMode && hasText ? (
            <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-8">
              <button
                onClick={() => setPresentationMode(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer"
                aria-label="Exit presentation mode"
              >
                <Minimize2 className="h-6 w-6" />
              </button>
              <div className="text-white text-3xl md:text-5xl font-light leading-relaxed text-center max-w-4xl">
                {streamText}
                {streamPartial && (
                  <span className="text-blue-400 opacity-70">{streamPartial}</span>
                )}
              </div>
            </div>
          ) : null}

          {/* Transcript */}
          <TranscriptPanel
            text={streamText}
            segments={streamSegments}
            partial={streamPartial}
            mode="dictation"
            modelId={useAppStore.getState().modelId || ''}
            language={settings.language}
            isProcessing={isStreaming}
          />
        </div>
      </div>

      {/* Sidebar model picker for no-model state */}
      {!modelLoaded && (
        <div className="hidden md:block fixed right-0 top-0 bottom-0 w-72 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 overflow-y-auto shadow-lg z-30">
          <ModelPicker />
        </div>
      )}
    </div>
  )
}
