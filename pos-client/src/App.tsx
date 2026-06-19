import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/layout/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './Pages/Login/LoginPage'
import DashboardPage from './Pages/Dashboard/DashboardPage'
import Unauthorized from './Pages/Unauthorized'
import CategoriesPage from './Pages/Categories/CategoriesPage'
import ProductsPage from './Pages/Products/ProductsPage'
import CashRegisterPage from './Pages/CashRegister/CashRegisterPage'
import POSPage from '../src/Pages/POS/POSPage'
import InventoryPage from './Pages/Inventory/InventoryPage'
import SalesPage     from './Pages/Sales/SalesPage'
import UsersPage     from './Pages/Users/UsersPage'
import ReportsPage   from './Pages/Reports/ReportsPage'
import ClearToastsOnRouteChange from '../src/components/ClearToastOnRouteChange'
import LayawaysPage from '../src/Pages/Layaways/LayawaysPage'

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
        <ClearToastsOnRouteChange />
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
                <ProtectedRoute roles={['Admin', 'Inventario', 'Cajero']}>
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
                  <CashRegisterPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/sales"
              element={
                <ProtectedRoute roles={['Admin', 'Supervisor','Cajero']}>
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
                <ProtectedRoute roles={['Admin', 'Supervisor', 'Cajero']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            <Route path="/layaways" element={
              <ProtectedRoute roles={['Admin','Cajero','Supervisor','Almacen']}>
                <LayawaysPage />
              </ProtectedRoute>
            }/>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}