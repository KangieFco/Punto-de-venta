import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 h-screen w-64 overflow-y-auto bg-white z-40">
        <Sidebar />
      </aside>

      <main className="ml-64 min-h-screen overflow-y-auto">
        <Outlet />
      </main>

      <Toaster position="top-right" />
    </div>
  )
}