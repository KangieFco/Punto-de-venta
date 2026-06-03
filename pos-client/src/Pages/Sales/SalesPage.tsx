import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Eye, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { salesApi, type Sale } from '../../api/sales'
import { useAuthStore } from '../../store/authStore'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

export default function SalesPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const canCancel = ['Admin', 'Supervisor'].includes(user?.role ?? '')

  const [detail, setDetail] = useState<Sale | null>(null)
  const [cancelling, setCancelling] = useState<Sale | null>(null)

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesApi.getAll().then(r => r.data.data ?? []),
  })

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
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Ventas
        </h1>
        <p className="text-gray-500 text-base mt-1">
          {sales?.length ?? 0} ventas registradas
        </p>
      </div>

      {/* Tabla */}
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
                <th className="text-left px-8 py-4 font-semibold text-gray-600">
                  Folio
                </th>
                <th className="text-left px-8 py-4 font-semibold text-gray-600">
                  Cajero
                </th>
                <th className="text-right px-8 py-4 font-semibold text-gray-600">
                  Total
                </th>
                <th className="text-left px-8 py-4 font-semibold text-gray-600">
                  Pago
                </th>
                <th className="text-left px-8 py-4 font-semibold text-gray-600">
                  Estado
                </th>
                <th className="text-left px-8 py-4 font-semibold text-gray-600">
                  Fecha
                </th>
                <th className="px-8 py-4" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-gray-400 text-lg"
                  >
                    Cargando...
                  </td>
                </tr>
              ) : sales?.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-gray-400 text-lg"
                  >
                    Sin ventas
                  </td>
                </tr>
              ) : (
                sales?.map(s => (
                  <tr key={s.id} className="hover:bg-black-50">
                    <td className="px-8 py-6 font-mono font-bold text-primary-600 text-base">
                      {s.folio}
                    </td>
                    <td className="px-8 py-6 text-black-700 font-medium">
                      {s.userFullName}
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-black-900">
                      ${s.total.toFixed(2)}
                    </td>
                    <td className="px-8 py-6 text-black-700">
                      <span>
                        {{
                          Cash: '💵 Efectivo',
                          Card: '💳 Tarjeta',
                          Other: '🔄 Otro',
                        }[s.paymentMethod] ?? s.paymentMethod}
                      </span>
                    </td>

                    <td className="px-8 py-6">
                      <Badge
                        label={
                          s.status === 'Completed'
                            ? 'Completada'
                            : 'Cancelada'
                        }
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
      </div>

      {/* Modal detalle */}
      {detail && (
        <SaleDetailModal
          sale={detail}
          onClose={() => setDetail(null)}
        />
      )}

      {/* Modal cancelar */}
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
  return (
    <Modal title={`Venta ${sale.folio}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        {/* Info general */}
        <div className="grid grid-cols-2 gap-4 text-base">
          <div>
            <span className="text-gray-500">Cajero:</span>
            <span className="ml-2 font-medium">
              {sale.userFullName}
            </span>
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
              {{
                Cash: 'Efectivo',
                Card: 'Tarjeta',
                Other: 'Otro',
              }[sale.paymentMethod] ?? sale.paymentMethod}
            </span>
          </div>

          <div>
            <span className="text-gray-500 mr-2">Estado:</span>
            <Badge
              label={
                sale.status === 'Completed'
                  ? 'Completada'
                  : 'Cancelada'
              }
              variant={sale.status === 'Completed' ? 'green' : 'red'}
            />
          </div>
        </div>

        {/* Productos */}
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
                <td className="px-4 py-3">
                  {d.productName}
                </td>

                <td className="px-4 py-3 text-right">
                  {d.quantity}
                </td>

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

        {/* Totales */}
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
          ¿Cancelar la venta <strong>{sale.folio}</strong>?
          Se revertirá el inventario.
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
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            No cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn-danger"
          >
            {loading ? 'Cancelando...' : 'Sí, cancelar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}