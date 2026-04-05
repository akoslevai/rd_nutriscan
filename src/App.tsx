import { Routes, Route } from 'react-router-dom'
import BottomNav from '@/components/BottomNav'
import ScannerPage from '@/pages/ScannerPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import HistoryPage from '@/pages/HistoryPage'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  return (
    <div className="flex flex-col h-svh max-w-md mx-auto bg-white dark:bg-gray-950">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<ScannerPage />} />
          <Route path="/product/:ean" element={<ProductDetailPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
