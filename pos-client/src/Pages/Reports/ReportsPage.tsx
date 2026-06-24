import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { BarChart2, TrendingUp, Calendar } from 'lucide-react'
import { reportsApi } from '../../api/reports'
import { layawaysApi } from '../../api/layaways'
import { formatDateTime, getLocalDateKey } from '../../utils/date'
import { parsePaymentBreakdown } from '../../utils/salesFormatters'

type Tab = 'daily' | 'range' | 'products'

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('daily')

  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)

  const { data: daily, isLoading: loadingDaily } = useQuery({
    queryKey: ['report-daily', date],
    queryFn: () => reportsApi.getDailySummary(date).then(r => r.data.data!),
    enabled: tab === 'daily',
  })

  const { data: salesReport, isLoading: loadingSales } = useQuery({
    queryKey: ['report-sales', from, to],
    queryFn: () => reportsApi.getSales(from, to).then(r => r.data.data!),
    enabled: tab === 'range',
  })

  const { data: topProducts, isLoading: loadingTop } = useQuery({
    queryKey: ['report-top', from, to],
    queryFn: () => reportsApi.getTopProducts(from, to).then(r => r.data.data ?? []),
    enabled: tab === 'products',
  })

  const { data: dailySalesReport } = useQuery({
    queryKey: ['report-daily-sales', date],
    queryFn: () => reportsApi.getSales(date, date).then(r => r.data.data!),
    enabled: tab === 'daily',
  })

  const { data: dailyLayaways } = useQuery({
    queryKey: ['report-daily-layaways', date],
    queryFn: () => layawaysApi.getAll().then(r => r.data.data ?? []),
    enabled: tab === 'daily',
  })

  const dailyPaymentTotals = useMemo(() => {
    const totals = {
      cash: 0,
      card: 0,
      dollar: 0,
      mixed: 0,
    }

    const addPayment = (method: string, amount: number) => {
      if (method === 'Cash' || method === '1') totals.cash += amount
      else if (method === 'Card' || method === '2') totals.card += amount
      else if (method === 'Dollar' || method === '3') totals.dollar += amount
      else totals.mixed += amount
    }

    dailySalesReport?.sales
      ?.filter((s: any) => s.status === 'Completed')
      .forEach((s: any) => {
        const breakdown = parsePaymentBreakdown(s.paymentBreakdown)

        if (s.paymentMethod === 'Mixed' && breakdown.length > 0) {
          breakdown.forEach(p => addPayment(p.method, p.amount))
          return
        }

        addPayment(s.paymentMethod, s.total)
      })

    dailyLayaways?.forEach(layaway => {
      layaway.payments?.forEach(payment => {
        if (getLocalDateKey(payment.createdAt) !== date) return
        addPayment(payment.paymentMethod, payment.amount)
      })
    })

    return totals
  }, [dailySalesReport, dailyLayaways, date])

  const paymentTotal =
    dailyPaymentTotals.cash +
    dailyPaymentTotals.card +
    dailyPaymentTotals.dollar +
    dailyPaymentTotals.mixed

  const tabs = [
    { key: 'daily', label: 'Resumen diario', icon: Calendar },
    { key: 'range', label: 'Ventas por período', icon: BarChart2 },
    { key: 'products', label: 'Top productos', icon: TrendingUp },
  ] as const

  function PaymentMethodCell({ sale }: { sale: any }) {
    const breakdown = sale.paymentBreakdown ?? sale.payments ?? []

    if (sale.paymentMethod === 'Mixed' && breakdown.length > 0) {
      return (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-black-700">🔀 Pago mixto</span>

          <div className="flex flex-wrap gap-2">
            {breakdown.map((p: any, index: number) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded-full border bg-white text-black-700"
              >
                {getPaymentLabel(p.method)} ${Number(p.amount).toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )
    }

    return <span>{getPaymentLabel(sale.paymentMethod)}</span>
  }

  function getPaymentLabel(method: string) {
    switch (method) {
      case 'Cash':
      case '1':
        return '💵 Efectivo'
      case 'Card':
      case '2':
        return '💳 Tarjeta'
      case 'Dollar':
      case '3':
        return '🇺🇸 Dólares'
      case 'Mixed':
        return '🔀 Pago mixto'
      default:
        return method
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black-900">Reportes</h1>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-black-500 hover:text-black-700'
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'daily' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-black-700">Fecha:</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input max-w-sm"
            />
          </div>

          {loadingDaily ? (
            <p className="text-black-400">Cargando...</p>
          ) : daily ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Ventas" value={daily.totalSales.toString()} color="blue" />
                <KpiCard
                  label="Ingresos"
                  value={`$${daily.totalRevenue.toFixed(2)}`}
                  color="green"
                />
                <KpiCard
                  label="Canceladas"
                  value={daily.cancelledSales.toString()}
                  color="red"
                />
                <KpiCard
                  label="Efectivo"
                  value={`$${dailyPaymentTotals.cash.toFixed(2)}`}
                  color="yellow"
                />
              </div>

              <div className="card">
                <h3 className="font-semibold text-black-900 mb-4">
                  Ingresos por método de pago
                </h3>

                <div className="space-y-3">
                  {[
                    { label: '💵 Efectivo', value: dailyPaymentTotals.cash },
                    { label: '💳 Tarjeta', value: dailyPaymentTotals.card },
                    { label: '🇺🇸 Dólares', value: dailyPaymentTotals.dollar },
                    { label: '🔀 Pago mixto', value: dailyPaymentTotals.mixed },
                  ].map(({ label, value }) => {
                    const pct = paymentTotal > 0 ? (value / paymentTotal) * 100 : 0

                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-black-600">{label}</span>
                          <span className="font-medium">
                            ${value.toFixed(2)}
                            <span className="text-black-400 ml-1 text-sm">
                              ({pct.toFixed(0)}%)
                            </span>
                          </span>
                        </div>

                        <div className="h-2 bg-black-100 rounded-full">
                          <div
                            className="h-2 bg-primary-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {daily.topProducts.length > 0 && (
                <div className="card overflow-hidden p-0">
                  <div className="px-10 py-6 border-b">
                    <h3 className="font-semibold text-black-900">
                      Top 5 productos del día
                    </h3>
                  </div>

                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-8 py-6 font-medium text-black-600">#</th>
                        <th className="text-left px-8 py-6 font-medium text-black-600">
                          Producto
                        </th>
                        <th className="text-right px-8 py-6 font-medium text-black-600">
                          Cantidad
                        </th>
                        <th className="text-right px-8 py-6 font-medium text-black-600">
                          Ingresos
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {daily.topProducts.map((p, i) => (
                        <tr key={p.productId} className="hover:bg-black-50">
                          <td className="px-8 py-6 text-black-400 font-bold">
                            #{i + 1}
                          </td>
                          <td className="px-8 py-6 font-medium text-black-900">
                            {p.productName}
                          </td>
                          <td className="px-8 py-6 text-right text-black-700">
                            {p.totalQuantitySold}
                          </td>
                          <td className="px-8 py-6 text-right font-bold text-primary-600">
                            ${p.totalRevenue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {tab === 'range' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-black-700">Desde:</label>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="input max-w-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-black-700">Hasta:</label>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="input max-w-sm"
              />
            </div>
          </div>

          {loadingSales ? (
            <p className="text-black-400">Cargando...</p>
          ) : salesReport ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <KpiCard
                  label="Ventas completadas"
                  value={salesReport.totalSales.toString()}
                  color="green"
                />
                <KpiCard
                  label="Canceladas"
                  value={salesReport.cancelledSales.toString()}
                  color="red"
                />
                <KpiCard
                  label="Total ingresos"
                  value={`$${salesReport.totalRevenue.toFixed(2)}`}
                  color="blue"
                />
              </div>

              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-8 py-6 font-medium text-black-600">Folio</th>
                      <th className="text-left px-8 py-6 font-medium text-black-600">Cajero</th>
                      <th className="text-right px-8 py-6 font-medium text-black-600">Total</th>
                      <th className="text-left px-8 py-6 font-medium text-black-600">Pago</th>
                      <th className="text-left px-8 py-6 font-medium text-black-600">Estado</th>
                      <th className="text-left px-8 py-6 font-medium text-black-600">Fecha</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {salesReport.sales.map((s, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-8 py-6 font-mono text-primary-600 font-bold">
                          {s.folio}
                        </td>
                        <td className="px-8 py-6 text-black-700">{s.userFullName}</td>
                        <td className="px-8 py-6 text-right font-bold">
                          ${s.total.toFixed(2)}
                        </td>
                        <td className="px-8 py-6 text-black-600">
                          <PaymentMethodCell sale={s} />
                        </td>
                        <td className="px-8 py-6">
                          <span
                            className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                              s.status === 'Completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {s.status === 'Completed' ? 'Completada' : 'Cancelada'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-black-500 whitespace-nowrap">
                          {formatDateTime(s.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-black-700">Desde:</label>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="input max-w-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-black-700">Hasta:</label>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="input max-w-sm"
              />
            </div>
          </div>

          {loadingTop ? (
            <p className="text-black-400">Cargando...</p>
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-black-600">#</th>
                    <th className="text-left px-4 py-3 font-medium text-black-600">
                      Producto
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-black-600">
                      Unidades vendidas
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-black-600">
                      Ingresos
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {topProducts?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-black-400">
                        Sin datos para el período
                      </td>
                    </tr>
                  ) : (
                    topProducts?.map((p, i) => (
                      <tr key={p.productId} className="hover:bg-black-50">
                        <td className="px-8 py-6 text-black-400 font-bold w-12">
                          #{i + 1}
                        </td>
                        <td className="px-8 py-6 font-medium text-black-900">
                          {p.productName}
                        </td>
                        <td className="px-8 py-6 text-right text-black-700 font-medium">
                          {p.totalQuantitySold}
                        </td>
                        <td className="px-8 py-6 text-right font-bold text-primary-600">
                          ${p.totalRevenue.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, color }: {
  label: string
  value: string
  color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    red: 'bg-red-50 border-red-100',
    yellow: 'bg-yellow-50 border-yellow-100',
  }

  const text: Record<string, string> = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    red: 'text-red-700',
    yellow: 'text-yellow-700',
  }

  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm text-black-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${text[color]}`}>{value}</p>
    </div>
  )
}