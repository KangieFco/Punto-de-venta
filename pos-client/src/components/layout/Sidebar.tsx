import { NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, Package, LayoutDashboard, Users, BarChart2, DollarSign, LogOut, AlertTriangle, Tag } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import { usePermissions } from '../../hooks/usePermissions'

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard, roles: ['Admin','Supervisor','Cajero','Inventario'] },
  { to: '/pos',        label: 'Punto de Venta', icon: ShoppingCart, roles: ['Admin','Supervisor','Cajero'] },
  { to: '/products',   label: 'Productos',   icon: Package,         roles: ['Admin','Inventario','Supervisor'] },
  { to: '/categories', label: 'Categorías',  icon: Tag,             roles: ['Admin','Inventario'] },
  { to: '/inventory',  label: 'Inventario',  icon: AlertTriangle,   roles: ['Admin','Inventario','Supervisor'] },
  { to: '/cash',       label: 'Caja',        icon: DollarSign,      roles: ['Admin','Cajero','Supervisor'] },
  { to: '/sales',      label: 'Ventas',      icon: BarChart2,       roles: ['Admin','Supervisor'] },
  { to: '/users',      label: 'Usuarios',    icon: Users,           roles: ['Admin'] },
  { to: '/reports',    label: 'Reportes',    icon: BarChart2,       roles: ['Admin','Supervisor'] },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()
  const p                = usePermissions()

  const handleLogout = async () => {
    await authApi.logout().catch(() => {})
    logout()
    navigate('/login')
  }

  const visible = navItems.filter(
    item => !item.roles || item.roles.includes(user?.role ?? '')
  )

  const roleColors: Record<string, string> = {
    Admin:      'bg-red-500',
    Cajero:     'bg-green-500',
    Inventario: 'bg-yellow-500',
    Supervisor: 'bg-blue-500',
    Almacen:    'bg-purple-500',
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">🏪 POS System</h1>
        <p className="text-xs text-gray-400 mt-1">{user?.fullName}</p>
        <span className={`text-xs ${roleColors[user?.role ?? ''] || 'bg-gray-500'} px-2 py-0.5 rounded-full`}>
          {user?.role}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
               transition-colors font-medium
               ${isActive
                 ? 'bg-primary-600 text-white'
                 : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5
                     text-sm text-gray-300 hover:bg-gray-800
                     hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}