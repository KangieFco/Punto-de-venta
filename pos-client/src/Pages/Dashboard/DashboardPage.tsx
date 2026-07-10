import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, BarChart3, Box, CreditCard, DollarSign, Package, ShoppingCart } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { salesApi, type Sale } from '../../api/sales'
import { productsApi, type Product } from '../../api/products'
import { cashRegistersApi, type CashRegister } from '../../api/cashRegisters'
import { layawaysApi, type Layaway } from '../../api/layaways'
import { SalesLast7DaysChart, PaymentMethodsChart, TopProductsChart } from '../../components/dashboard/SalesLast7DaysChart'
import { getLocalDateKey } from '../../utils/date'


export default function DashboardPage() {
  const { user } = useAuthStore()
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)
  const [layaways, setLayaways] = useState<Layaway[]>([])
  const [loading, setLoading] = useState(true)
  const TIME_ZONE = 'America/Chihuahua'

  useEffect(() => {
    loadDashboard()
  }, [])

  const getData = <T,>(res: any): T => {
    return res.data?.data ?? res.data
  }

  const loadDashboard = async () => {
    try {
      setLoading(true)

      const [salesRes, productsRes, cashRes, layawaysRes] =
        await Promise.all([
          salesApi.getAll(),
          productsApi.getAll(true),
          cashRegistersApi.getCurrent(),
          layawaysApi.getAll(),
        ])

      setSales(getData<Sale[]>(salesRes))
      setProducts(getData<Product[]>(productsRes))
      setCashRegister(getData<CashRegister | null>(cashRes))
      setLayaways(getData<Layaway[]>(layawaysRes))
    } finally {
      setLoading(false)
    }
  }

  const todayKey = getLocalDateKey(new Date())

  const completedSalesToday = useMemo(() => {
    return sales.filter(s => {
      const saleDateKey = getLocalDateKey(s.createdAt)
      const status = s.status?.toLowerCase()

      return (
        saleDateKey === todayKey &&
        status !== 'cancelled' &&
        status !== 'cancelada' &&
        status !== 'canceled'
      )
    })
  }, [sales, todayKey])

  const totalSalesToday = completedSalesToday.reduce(
    (sum, s) => sum + toNumber(s.total),
    0
  )

  const totalTicketsToday = completedSalesToday.length
  const averageTicket =
    totalTicketsToday > 0 ? totalSalesToday / totalTicketsToday : 0

  const paymentSummary = useMemo(() => {
    const summary = {
      cash: 0,
      card: 0,
      dollar: 0,
      other: 0,
    }

    completedSalesToday.forEach((sale: any) => {
      if (sale.paymentBreakdown?.length > 0) {
        sale.paymentBreakdown.forEach((p: any) => {
          const method = p.method?.toLowerCase() ?? ''
          const amount = toNumber(p.amount)

          if (method.includes('cash') || method.includes('efectivo')) {
            summary.cash += amount
          } else if (method.includes('card') || method.includes('tarjeta')) {
            summary.card += amount
          } else if (
            method.includes('dollar') ||
            method.includes('dólar') ||
            method.includes('dolar')
          ) {
            summary.dollar += amount
          } else {
            summary.other += amount
          }
        })
      } else {
        const method = sale.paymentMethod?.toLowerCase() ?? ''
        const total = toNumber(sale.total)

        if (method.includes('cash') || method.includes('efectivo')) {
          summary.cash += total
        } else if (method.includes('card') || method.includes('tarjeta')) {
          summary.card += total
        } else if (
          method.includes('dollar') ||
          method.includes('dólar') ||
          method.includes('dolar')
        ) {
          summary.dollar += total
        } else {
          summary.other += total
        }
      }
    })

    return summary
  }, [completedSalesToday])

  const salesLast7Days = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))

      return {
        key: getLocalDateKey(date),
        label: date.toLocaleDateString('es-MX', {
          timeZone: TIME_ZONE,
          weekday: 'short',
        }),
        total: 0,
      }
    })

    sales.forEach(sale => {
      const status = sale.status?.toLowerCase()

      if (
        status === 'cancelled' ||
        status === 'cancelada' ||
        status === 'canceled'
      ) {
        return
      }

      const saleDateKey = getLocalDateKey(sale.createdAt)
      const day = days.find(d => d.key === saleDateKey)

      if (day) {
        day.total += toNumber(sale.total)
      }
    })

    return days
  }, [sales])

  const topProductsSold = useMemo(() => {
    const map = new Map<string, number>()

    sales.forEach((sale: any) => {
      const status = sale.status?.toLowerCase()

      if (
        status === 'cancelled' ||
        status === 'cancelada' ||
        status === 'canceled'
      ) {
        return
      }

      const details = sale.details ?? sale.items ?? []

      details.forEach((item: any) => {
        const name =
          item.productName ??
          item.name ??
          item.product?.name ??
          'Producto'

        const quantity = toNumber(item.quantity)

        map.set(name, (map.get(name) ?? 0) + quantity)
      })
    })

    return Array.from(map.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [sales])

  const lowStockProducts = products
    .filter(p => p.isLowStock || p.stock <= p.minStock)
    .sort((a, b) => a.stock - b.stock)

    const isActiveLayaway = (status: unknown) => {
    const value = String(status ?? '').toLowerCase()

    return (
      value === 'active' ||
      value === 'activo' ||
      value === 'pending' ||
      value === 'pendiente'
    )
  }

  const activeLayaways = layaways.filter(
    l => isActiveLayaway(l.status)
  )

  const expiredLayaways = activeLayaways.filter(
    l => l.isExpired
  )

  const todayExpiringLayaways = activeLayaways.filter(l => {
    if (l.isExpired) return false

    const today = new Date()

    const expireDate = new Date(l.expiresAt)

    return (
      expireDate.getFullYear() === today.getFullYear() &&
      expireDate.getMonth() === today.getMonth() &&
      expireDate.getDate() === today.getDate()
    )
  })

  const alerts = [
    !cashRegister ? 'Caja sin abrir' : null,
    lowStockProducts.length > 0
      ? `${lowStockProducts.length} productos con bajo stock`
      : null,
    expiredLayaways.length > 0
      ? `${expiredLayaways.length} apartados vencidos`
      : null,
    todayExpiringLayaways.length > 0
      ? `${todayExpiringLayaways.length} apartados vencen hoy`
      : null,
  ].filter(Boolean)

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Cargando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.fullName} !!
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 mt-1" size={22} />
            <div>
              <h2 className="font-bold text-red-700">Atención</h2>
              <div className="mt-2 space-y-1">
                {alerts.map((alert, index) => (
                  <p key={index} className="text-sm text-red-700">
                    • {alert}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Ventas hoy"
          value={formatCurrency(totalSalesToday)}
          subtitle={`${totalTicketsToday} ventas · Ticket promedio ${formatCurrency(
            averageTicket
          )}`}
          icon={<ShoppingCart className="text-blue-600" size={24} />}
          color="blue"
        />

        <StatCard
          title="Caja actual"
          value={cashRegister ? 'Abierta' : 'Cerrada'}
          subtitle={
            cashRegister
              ? `Apertura: ${formatCurrency( (cashRegister as any).openingAmount ?? 0 )}`
              : 'Abre caja para vender'
          }
          icon={<DollarSign className="text-yellow-600" size={24} />}
          color="yellow"
        />

        <StatCard
          title="Productos críticos"
          value={String(lowStockProducts.length)}
          subtitle={
            lowStockProducts[0]
              ? `${lowStockProducts[0].name}: quedan ${lowStockProducts[0].stock}`
              : 'Sin alertas'
          }
          icon={<Package className="text-red-600" size={24} />}
          color="red"
        />

        <StatCard
          title="Apartados"
          value={String(activeLayaways.length)}
          subtitle={`${expiredLayaways.length} vencidos · ${todayExpiringLayaways.length} vencen hoy`}
          icon={<Box className="text-purple-600" size={24} />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard title="Ventas últimos 7 días" icon={<BarChart3 size={20} />}>
          <SalesLast7DaysChart
            labels={salesLast7Days.map(d => d.label)}
            values={salesLast7Days.map(d => d.total)}
          />
        </SectionCard>

        <SectionCard title="Métodos de pago de hoy" icon={<CreditCard size={20} />}>
          <PaymentMethodsChart
            cash={paymentSummary.cash}
            card={paymentSummary.card}
            dollar={paymentSummary.dollar}
            other={paymentSummary.other}
          />

          <div className="mt-4">
            <PaymentRow label="Efectivo" amount={paymentSummary.cash} />
            <PaymentRow label="Tarjeta" amount={paymentSummary.card} />
            <PaymentRow label="Dólares" amount={paymentSummary.dollar} />
            <PaymentRow label="Otros" amount={paymentSummary.other} />
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <SectionCard title="Productos más vendidos" icon={<BarChart3 size={20} />}>
          {topProductsSold.length === 0 ? (
            <EmptyText text="Aún no hay productos vendidos." />
          ) : (
            <TopProductsChart
              labels={topProductsSold.map(p => p.name)}
              values={topProductsSold.map(p => p.quantity)}
            />
          )}
        </SectionCard>

        <SectionCard title="Productos por reabastecer" icon={<Package size={20} />}>
          {lowStockProducts.length === 0 ? (
            <EmptyText text="No hay productos bajos de stock." />
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map(product => (
                <div
                  key={product.id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      Mínimo: {product.minStock}
                    </p>
                  </div>
                  <span className="font-bold text-red-600">
                    {product.stock}
                  </span>
                </div>
              ))}

              <Link
                to="/products"
                className="text-sm font-medium text-blue-600 inline-block pt-2"
              >
                Ver productos →
              </Link>
            </div>
          )}
        </SectionCard>  
          <SectionCard title="Resumen rápido" icon={<BarChart3 size={20} />}>
          <div className="grid grid-cols-2 gap-4">
            <MiniMetric
              label="Ventas realizadas"
              value={String(totalTicketsToday)}
            />
            <MiniMetric
              label="Ticket promedio"
              value={formatCurrency(averageTicket)}
            />
            <MiniMetric
              label="Productos activos"
              value={String(products.length)}
            />
            <MiniMetric
              label="Apartados activos"
              value={String(activeLayaways.length)}
            />
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50',
    yellow: 'bg-yellow-50',
    red: 'bg-red-50',
    purple: 'bg-purple-50',
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-gray-600">{icon}</div>
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function PaymentRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between items-center border-b py-3">
      <span className="text-gray-600">{label}</span>
      <span className="font-bold text-gray-900">
        {formatCurrency(amount ?? 0)}
      </span>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}

function EmptyText({ text }: { text: string }) {
  return <p className="text-sm text-gray-500">{text}</p>
}

function toNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatCurrency(value: unknown) {
  return toNumber(value).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  })
}