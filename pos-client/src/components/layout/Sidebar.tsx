import { NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, Package, LayoutDashboard, Users, BarChart2, DollarSign, LogOut, AlertTriangle, Tag, Archive } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['Admin', 'Supervisor', 'Cajero', 'Inventario'],
  },
  {
    to: '/pos',
    label: 'Punto de Venta',
    icon: ShoppingCart,
    roles: ['Admin', 'Supervisor', 'Cajero'],
  },
  {
    to: '/products',
    label: 'Productos',
    icon: Package,
    roles: ['Admin', 'Inventario', 'Cajero'],
  },
  {
    to: '/categories',
    label: 'Categorías',
    icon: Tag,
    roles: ['Admin', 'Inventario'],
  },
  {
    to: '/inventory',
    label: 'Inventario',
    icon: AlertTriangle,
    roles: ['Admin', 'Inventario', 'Supervisor'],
  },
  {
    to: '/cash',
    label: 'Caja',
    icon: DollarSign,
    roles: ['Admin', 'Cajero', 'Supervisor'],
  },
  {
    to: '/sales',
    label: 'Ventas',
    icon: BarChart2,
    roles: ['Admin', 'Supervisor', 'Cajero'],
  },
  {
    to: '/users',
    label: 'Usuarios',
    icon: Users,
    roles: ['Admin'],
  },
  {
    to: '/reports',
    label: 'Reportes',
    icon: BarChart2,
    roles: ['Admin', 'Supervisor', 'Cajero'],
  },
  {
    to: '/layaways',
    label: 'Apartados',
    icon: Archive,
    roles: ['Admin', 'Supervisor', 'Cajero', 'Almacen'],
  },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authApi.logout().catch(() => {})
    logout()
    navigate('/login')
  }

  const visible = navItems.filter(
    item => !item.roles || item.roles.includes(user?.role ?? ''),
  )

  const roleColors: Record<string, string> = {
    Admin: 'bg-red-500',
    Cajero: 'bg-green-500',
    Inventario: 'bg-yellow-500',
    Supervisor: 'bg-blue-500',
    Almacen: 'bg-purple-500',
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-hidden bg-gray-900 text-white">
      {/* Logo */}
      <div className="shrink-0 border-b border-gray-700 px-6 py-4">
        <div className="mb-2 flex justify-center">
          <img
            src="/Logo_KS.png"
            alt="Logo"
            className="h-16 w-16 object-contain"
          />
        </div>

        <h1 className="text-center text-lg font-bold text-white">
          KangSync Software
        </h1>

        <p className="mt-1 truncate text-center text-sm text-gray-400">
          {user?.fullName}
        </p>

        <div className="mt-2 flex justify-center">
          <span
            className={`rounded-full px-2.5 py-1 text-xs ${
              roleColors[user?.role ?? ''] || 'bg-gray-500'
            }`}
          >
            {user?.role}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-hidden px-3 py-3">
        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-gray-700 px-3 py-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut size={18} className="shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}