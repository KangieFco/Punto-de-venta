import { useAuthStore } from '../../store/authStore'
import { ShoppingCart, Package, DollarSign, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.fullName} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('es-MX', {
            weekday: 'long', year: 'numeric',
            month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas hoy"
          value="$0.00"
          icon={<ShoppingCart className="text-blue-600" size={24} />}
          color="blue"
        />
        <StatCard
          title="Productos"
          value="0"
          icon={<Package className="text-green-600" size={24} />}
          color="green"
        />
        <StatCard
          title="Caja actual"
          value="Cerrada"
          icon={<DollarSign className="text-yellow-600" size={24} />}
          color="yellow"
        />
        <StatCard
          title="Bajo stock"
          value="0"
          icon={<AlertTriangle className="text-red-600" size={24} />}
          color="red"
        />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: {
  title: string; value: string; icon: React.ReactNode; color: string
}) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50',
    green:  'bg-green-50',
    yellow: 'bg-yellow-50',
    red:    'bg-red-50',
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  )
}