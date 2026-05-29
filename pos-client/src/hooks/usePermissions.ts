import { useAuthStore } from '../store/authStore'

type Role = 'Admin' | 'Cajero' | 'Inventario' | 'Supervisor' | 'Almacen'

export function usePermissions() {
  const { user } = useAuthStore()
  const role     = (user?.role ?? '') as Role

  const is = (...roles: Role[]) => roles.includes(role)

  return {
    role,

    // ── Navegación ────────────────────────────────────────────
    canAccessPOS:       is('Admin', 'Cajero', 'Supervisor', 'Almacen'),
    canAccessProducts:  is('Admin', 'Inventario', 'Supervisor', 'Cajero'),
    canAccessCategories:is('Admin', 'Inventario', 'Cajero'),
    canAccessInventory: is('Admin', 'Inventario', 'Supervisor', 'Cajero'),
    canAccessCash:      is('Admin', 'Cajero', 'Supervisor', 'Cajero'),
    canAccessSales:     is('Admin', 'Supervisor', 'Cajero'),
    canAccessUsers:     is('Admin', 'Almacen'),
    canAccessReports:   is('Admin', 'Supervisor', 'Cajero'),

    // ── Productos ─────────────────────────────────────────────
    canCreateProduct:   is('Admin', 'Inventario'),
    canEditProduct:     is('Admin', 'Inventario'),
    canToggleProduct:   is('Admin', 'Inventario', 'Cajero'),

    // ── Inventario ────────────────────────────────────────────
    canAddEntry:        is('Admin', 'Inventario', 'Cajero'),
    canAddOutput:       is('Admin', 'Inventario'),
    canAddAdjustment:   is('Admin', 'Inventario'),

    // ── Caja ──────────────────────────────────────────────────
    canOpenCash:        is('Admin', 'Cajero', 'Supervisor', 'Cajero'),
    canCloseCash:       is('Admin', 'Cajero', 'Supervisor'),
    canCashMovements:   is('Admin', 'Cajero', 'Supervisor'),

    // ── Ventas ────────────────────────────────────────────────
    canCreateSale:      is('Admin', 'Cajero', 'Supervisor', 'Cajero'),
    canCancelSale:      is('Admin', 'Supervisor'),

    // ── Usuarios ──────────────────────────────────────────────
    canManageUsers:     is('Admin'),

    // ── Reportes ──────────────────────────────────────────────
    canViewReports:     is('Admin', 'Supervisor', 'Cajero'),
  }
}