import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { ToastContainer } from '@/components/ui/toast-container'
import { DictationPage } from '@/pages/dictation'
import { BatchPage } from '@/pages/batch'
import { HistoryPage } from '@/pages/history'
import { SettingsPage } from '@/pages/settings'
import { AboutPage } from '@/pages/about'
import { useAppStore, applyTheme } from '@/stores/app-store'
import { useWhisperWorker } from '@/hooks/use-whisper-worker'

export default function App() {
  const settings = useAppStore((s) => s.settings)

  // Initialize theme
  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  // Initialize worker
  useWhisperWorker()

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
          <Routes>
            <Route path="/" element={<DictationPage />} />
            <Route path="/batch" element={<BatchPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>

        {/* Mobile bottom nav */}
        <MobileNav />

        {/* Toasts */}
        <ToastContainer />
      </div>
    </BrowserRouter>
  )
}
