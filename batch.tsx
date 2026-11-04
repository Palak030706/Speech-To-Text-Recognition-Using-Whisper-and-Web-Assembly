import { useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useWhisperWorker } from '@/hooks/use-whisper-worker'
import { decodeAudioFile } from '@/audio/resample'
import { ClipRecorder } from '@/audio/capture'
import { TranscriptPanel } from '@/components/transcript/transcript-panel'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Button } from '@/components/ui/button'
import { AlertBanner } from '@/components/ui/status-chip'
import { ModelPicker } from '@/components/model/model-picker'
import { formatDuration, formatFileSize } from '@/lib/utils'
import {
  Upload,
  Mic,
  Square,
  Trash2,
  Save,
  FileAudio,
  Clock,
  Loader2,
} from 'lucide-react'

const SUPPORTED_FORMATS = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm', 'audio/flac']

export function BatchPage() {
  const {
    modelLoaded,
    workerState,
    batchText,
    batchSegments,
    batchProgress,
    isBatchTranscribing,
    clearBatchResult,
    settings,
    addToast,
    saveCurrentTranscript,
  } = useAppStore()

  const { transcribe, abort } = useWhisperWorker()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<ClipRecorder | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [decoding, setDecoding] = useState(false)
  const [audioInfo, setAudioInfo] = useState<{ duration: number; size: number } | null>(null)
  const startTimeRef = useRef<number>(0)

  const processAudio = useCallback(
    async (audioSource: File | Blob, name: string) => {
      if (!modelLoaded) {
        addToast('Please load a model first', 'warning')
        return
      }

      setFileName(name)
      setDecoding(true)

      try {
        const file = audioSource instanceof File ? audioSource : new File([audioSource], name)
        setAudioInfo({ duration: 0, size: file.size })

        const pcm = await decodeAudioFile(file)
        const durationMs = (pcm.length / 16000) * 1000
        setAudioInfo({ duration: durationMs, size: file.size })
        setDecoding(false)

        startTimeRef.current = performance.now()
        transcribe(pcm)
      } catch (err) {
        setDecoding(false)
        addToast(
          `Failed to decode audio: ${err instanceof Error ? err.message : 'Unsupported format'}. Try WAV format.`,
          'error',
        )
      }
    },
    [modelLoaded, transcribe, addToast],
  )

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (!SUPPORTED_FORMATS.some((f) => file.type.startsWith(f.split('/')[0]))) {
        addToast(`Unsupported format. Please use WAV, MP3, M4A, OGG, WebM, or FLAC.`, 'warning')
      }

      processAudio(file, file.name)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [processAudio, addToast],
  )

  const handleStartRecording = useCallback(async () => {
    try {
      const recorder = new ClipRecorder()
      await recorder.start()
      recorderRef.current = recorder
      setIsRecording(true)
      setRecordingDuration(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1)
      }, 1000)
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Failed to start recording',
        'error',
      )
    }
  }, [addToast])

  const handleStopRecording = useCallback(async () => {
    if (!recorderRef.current) return
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    const blob = await recorderRef.current.stop()
    recorderRef.current = null
    setIsRecording(false)
    processAudio(blob, `recording-${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.webm`)
  }, [processAudio])

  const handleSave = useCallback(async () => {
    await saveCurrentTranscript('batch')
    addToast('Transcript saved to history', 'success')
  }, [saveCurrentTranscript, addToast])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) processAudio(file, file.name)
    },
    [processAudio],
  )

  const hasResult = batchText.trim().length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Batch Transcription
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload or record audio for full transcription
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasResult && (
            <>
              <Button variant="ghost" size="icon-sm" onClick={handleSave} aria-label="Save to history">
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={clearBatchResult} aria-label="Clear result">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Model warning */}
          <AlertBanner show={!modelLoaded}>
            <strong>No model loaded.</strong> Load a whisper model to start transcribing.
          </AlertBanner>

          {/* Upload / Record area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-700">
                <FileAudio className="h-7 w-7 text-gray-400 dark:text-gray-500" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drop audio file here or
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  WAV, MP3, M4A, OGG, WebM, FLAC supported
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  aria-label="Upload audio file"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBatchTranscribing || decoding}
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>

                {!isRecording ? (
                  <Button
                    variant="default"
                    onClick={handleStartRecording}
                    disabled={isBatchTranscribing || decoding || !modelLoaded}
                  >
                    <Mic className="h-4 w-4" />
                    Record Clip
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleStopRecording}>
                    <Square className="h-4 w-4" />
                    Stop ({recordingDuration}s)
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Decoding / Transcribing progress */}
          {(decoding || isBatchTranscribing) && (
            <div className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {decoding ? 'Decoding audio...' : 'Transcribing...'}
              </div>
              {audioInfo && (
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {fileName && <span>{fileName}</span>}
                  <span>{formatFileSize(audioInfo.size)}</span>
                  {audioInfo.duration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(audioInfo.duration)}
                    </span>
                  )}
                </div>
              )}
              {isBatchTranscribing && (
                <ProgressBar value={batchProgress} showPercentage color="blue" />
              )}
            </div>
          )}

          {/* Transcript */}
          {(hasResult || isBatchTranscribing) && (
            <TranscriptPanel
              text={batchText}
              segments={batchSegments}
              mode="batch"
              modelId={useAppStore.getState().modelId || ''}
              language={settings.language}
              isProcessing={isBatchTranscribing}
            />
          )}
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
