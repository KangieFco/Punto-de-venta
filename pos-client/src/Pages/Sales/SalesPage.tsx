import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Eye, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { salesApi, type Sale } from '../../api/sales'
import { useAuthStore } from '../../store/authStore'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

type PaymentBreakdownItem = {
  method: string
  amount: number
}

type PeriodFilter = 'day' | 'week' | 'all'

const SALES_PER_PAGE = 10

const paymentLabels: Record<string, string> = {
  Cash: '💵 Efectivo',
  Card: '💳 Tarjeta',
  Dollar: '🇺🇸 Dólares',
  Other: '🔄 Otro',
  Mixed: '🔀 Pago mixto',
}

function formatPaymentMethod(method: string) {
  return paymentLabels[method] ?? method
}

function parsePaymentBreakdown(value: any): PaymentBreakdownItem[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.map(p => ({
      method: p.method,
      amount: Number(p.amount) || 0,
    }))
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(part => {
        const [method, amount] = part.split(':')
        return {
          method: method?.trim(),
          amount: Number(amount) || 0,
        }
      })
      .filter(p => p.method && p.amount > 0)
  }

  return []
}

export default function SalesPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const canCancel = ['Admin', 'Supervisor'].includes(user?.role ?? '')

  const [detail, setDetail] = useState<Sale | null>(null)
  const [cancelling, setCancelling] = useState<Sale | null>(null)
  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('day')
  const [page, setPage] = useState(1)

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesApi.getAll().then(r => r.data.data ?? []),
  })

  const filteredSales = useMemo(() => {
    const today = new Date()

    return (sales ?? [])
      .filter(s => {
        const term = search.toLowerCase().trim()

        if (term) {
          const matchesSearch =
            s.folio.toLowerCase().includes(term) ||
            s.userFullName.toLowerCase().includes(term) ||
            s.paymentMethod.toLowerCase().includes(term) ||
            s.status.toLowerCase().includes(term)

          if (!matchesSearch) return false
        }

        const saleDate = new Date(s.createdAt)

        if (periodFilter === 'day') {
          return saleDate.toDateString() === today.toDateString()
        }

        if (periodFilter === 'week') {
          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - today.getDay())
          startOfWeek.setHours(0, 0, 0, 0)

          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 7)

          return saleDate >= startOfWeek && saleDate < endOfWeek
        }

        return true
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }, [sales, search, periodFilter])

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / SALES_PER_PAGE))

  const paginatedSales = filteredSales.slice(
    (page - 1) * SALES_PER_PAGE,
    page * SALES_PER_PAGE
  )

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      salesApi.cancel(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['inventory-movements'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Venta cancelada')
      setCancelling(null)
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? 'Error al cancelar'),
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
        <p className="text-gray-500 text-base mt-1">
          {filteredSales.length} de {sales?.length ?? 0} ventas registradas
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <input
          className="input max-w-sm text-base font-medium"
          placeholder="Buscar por folio, cajero, pago o estado..."
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />

        <select
          className="input max-w-xs text-base font-medium"
          value={periodFilter}
          onChange={e => {
            setPeriodFilter(e.target.value as PeriodFilter)
            setPage(1)
          }}
        >
          <option value="day">Ventas de hoy</option>
          <option value="week">Ventas de esta semana</option>
          <option value="all">Todas las ventas</option>
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-base">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
              <col className="w-[14%]" />
              <col className="w-[17%]" />
              <col className="w-[6%]" />
            </colgroup>

            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-8 py-4 font-semibold text-gray-600">Folio</th>
                <th className="text-left px-8 py-4 font-semibold text-gray-600">Cajero</th>
                <th className="text-right px-8 py-4 font-semibold text-gray-600">Total</th>
                <th className="text-left px-8 py-4 font-semibold text-gray-600">Pago</th>
                <th className="text-left px-8 py-4 font-semibold text-gray-600">Estado</th>
                <th className="text-left px-8 py-4 font-semibold text-gray-600">Fecha</th>
                <th className="px-8 py-4" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-lg">
                    Cargando...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-lg">
                    Sin ventas
                  </td>
                </tr>
              ) : (
                paginatedSales.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-8 py-6 font-mono font-bold text-primary-600 text-base">
                      {s.folio}
                    </td>

                    <td className="px-8 py-6 text-gray-700 font-medium">
                      {s.userFullName}
                    </td>

                    <td className="px-8 py-6 text-right font-bold text-gray-900">
                      ${s.total.toFixed(2)}
                    </td>

                    <td className="px-8 py-6 text-gray-700">
                      {formatPaymentMethod(s.paymentMethod)}
                    </td>

                    <td className="px-8 py-6">
                      <Badge
                        label={s.status === 'Completed' ? 'Completada' : 'Cancelada'}
                        variant={s.status === 'Completed' ? 'green' : 'red'}
                      />
                    </td>

                    <td className="px-8 py-6 text-gray-700 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleString('es-MX')}
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetail(s)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={28} className="text-gray-500" />
                        </button>

                        {canCancel && s.status === 'Completed' && (
                          <button
                            onClick={() => setCancelling(s)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancelar venta"
                          >
                            <XCircle size={28} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredSales.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t">
            <p className="text-sm text-gray-600">
              Mostrando {paginatedSales.length} de {filteredSales.length} ventas
            </p>

            <div className="flex items-center gap-2">
              <button
                className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              >
                Anterior
              </button>

              <span className="text-sm font-semibold text-gray-700">
                Página {page} de {totalPages}
              </span>

              <button
                className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {detail && (
        <SaleDetailModal sale={detail} onClose={() => setDetail(null)} />
      )}

      {cancelling && (
        <CancelSaleDialog
          sale={cancelling}
          onClose={() => setCancelling(null)}
          onConfirm={(reason) =>
            cancelMutation.mutate({ id: cancelling.id, reason })
          }
          loading={cancelMutation.isPending}
        />
      )}
    </div>
  )
}

function SaleDetailModal({
  sale,
  onClose,
}: {
  sale: Sale
  onClose: () => void
}) {
  const breakdown = parsePaymentBreakdown((sale as any).paymentBreakdown)

  return (
    <Modal title={`Venta ${sale.folio}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-base">
          <div>
            <span className="text-gray-500">Cajero:</span>
            <span className="ml-2 font-medium">{sale.userFullName}</span>
          </div>

          <div>
            <span className="text-gray-500">Fecha:</span>
            <span className="ml-2 font-medium">
              {new Date(sale.createdAt).toLocaleString('es-MX')}
            </span>
          </div>

          <div>
            <span className="text-gray-500">Pago:</span>
            <span className="ml-2 font-medium">
              {formatPaymentMethod(sale.paymentMethod)}
            </span>
          </div>

          <div>
            <span className="text-gray-500 mr-2">Estado:</span>
            <Badge
              label={sale.status === 'Completed' ? 'Completada' : 'Cancelada'}
              variant={sale.status === 'Completed' ? 'green' : 'red'}
            />
          </div>

          {breakdown.length > 0 && (
            <div className="col-span-2">
              <p className="text-gray-500 text-sm mb-2">Desglose de pago:</p>

              <div className="flex gap-3 flex-wrap">
                {breakdown.map((p, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 border rounded-xl px-4 py-2 text-sm"
                  >
                    <span className="text-gray-500">
                      {formatPaymentMethod(p.method)}
                    </span>

                    <span className="font-bold text-gray-900 ml-2">
                      ${p.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <table className="w-full text-base border rounded-xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">
                Producto
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">
                Cant.
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">
                P. Unit.
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">
                Subtotal
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {sale.details.map((d, i) => (
              <tr key={i}>
                <td className="px-4 py-3">{d.productName}</td>
                <td className="px-4 py-3 text-right">{d.quantity}</td>
                <td className="px-4 py-3 text-right">
                  ${d.unitPrice.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  ${d.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-2 text-base border-t pt-4">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${sale.subtotal.toFixed(2)}</span>
          </div>

          {sale.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Descuento</span>
              <span>-${sale.discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-xl text-gray-900">
            <span>Total</span>
            <span>${sale.total.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-gray-500">
            <span>Pagó</span>
            <span>${sale.amountReceived.toFixed(2)}</span>
          </div>

          {sale.changeAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Cambio</span>
              <span>${sale.changeAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function CancelSaleDialog({
  sale,
  onClose,
  onConfirm,
  loading,
}: {
  sale: Sale
  onClose: () => void
  onConfirm: (reason: string) => void
  loading: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ reason: string }>()

  return (
    <Modal title="Cancelar venta" onClose={onClose} size="sm">
      <form
        onSubmit={handleSubmit(d => onConfirm(d.reason))}
        className="space-y-4"
      >
        <p className="text-base text-gray-600">
          ¿Cancelar la venta <strong>{sale.folio}</strong>? Se revertirá el inventario.
        </p>

        <div>
          <label className="block text-base font-medium text-gray-700 mb-1">
            Motivo <span className="text-red-500">*</span>
          </label>

          <input
            {...register('reason', {
              required: 'El motivo es requerido',
            })}
            className="input"
            placeholder="Ej: Error en cobro"
            autoFocus
          />

          {errors.reason && (
            <p className="text-red-500 text-sm mt-1">
              {errors.reason.message}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            No cancelar
          </button>

          <button type="submit" disabled={loading} className="btn-danger">
            {loading ? 'Cancelando...' : 'Sí, cancelar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}