import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/layout/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import  LoginPage  from './Pages/Login/LoginPage'
import  DashboardPage  from './Pages/Dashboard/DashboardPage'
import Unauthorized from './Pages/Unauthorized'

const POSPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Punto de Venta</h1>
    <p className="text-gray-500 mt-2">Próximamente — Fase 6</p>
  </div>
)

const ProductsPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Productos</h1>
    <p className="text-gray-500 mt-2">Próximamente — Fase 6</p>
  </div>
)

const CategoriesPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Categorías</h1>
    <p className="text-gray-500 mt-2">Próximamente — Fase 6</p>
  </div>
)

const InventoryPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Inventario</h1>
    <p className="text-gray-500 mt-2">Próximamente — Fase 6</p>
  </div>
)

const CashPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Caja</h1>
    <p className="text-gray-500 mt-2">Próximamente — Fase 6</p>
  </div>
)

const SalesPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Ventas</h1>
    <p className="text-gray-500 mt-2">Próximamente — Fase 6</p>
  </div>
)

const UsersPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Usuarios</h1>
    <p className="text-gray-500 mt-2">Próximamente — Fase 6</p>
  </div>
)

const ReportsPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Reportes</h1>
    <p className="text-gray-500 mt-2">Próximamente — Fase 6</p>
  </div>
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route
              path="/pos"
              element={
                <ProtectedRoute roles={['Admin', 'Cajero', 'Supervisor']}>
                  <POSPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <ProtectedRoute roles={['Admin', 'Inventario', 'Supervisor']}>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/categories"
              element={
                <ProtectedRoute roles={['Admin', 'Inventario']}>
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute roles={['Admin', 'Inventario', 'Supervisor']}>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cash"
              element={
                <ProtectedRoute roles={['Admin', 'Cajero', 'Supervisor']}>
                  <CashPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/sales"
              element={
                <ProtectedRoute roles={['Admin', 'Supervisor']}>
                  <SalesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute roles={['Admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute roles={['Admin', 'Supervisor']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}