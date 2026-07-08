import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { Layaway } from '../../../api/layaways'
import { layawaysApi } from '../../../api/layaways'
import Modal from '../../../components/ui/Modal'
import { paymentLabel, statusText } from '../../../utils/layawayHelpers'

type Props = {
  layaway: Layaway
  onClose: () => void
  onSuccess?: () => void
}

export default function LayawayDetailModal({
  layaway,
  onClose,
  onSuccess,
}: Props) {
  const expireMutation = useMutation({
    mutationFn: () => layawaysApi.expire(layaway.id),
    onSuccess: () => {
      toast.success('Producto liberado y abonos conservados')
      onSuccess?.()
      onClose()
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? 'Error al liberar apartado'),
  })

  const canExpire =
    layaway.status === 'Pending' && layaway.isExpired

  const daysLeftColor = layaway.isExpired
    ? 'text-red-600 bg-red-50 border-red-200'
    : layaway.daysLeft <= 7
      ? 'text-orange-600 bg-orange-50 border-orange-200'
      : layaway.daysLeft <= 15
        ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
        : 'text-green-600 bg-green-50 border-green-200'

  const daysLeftLabel = layaway.isExpired
    ? '❌ Vencido'
    : layaway.daysLeft === 0
      ? '⚠️ Vence hoy'
      : layaway.daysLeft === 1
        ? '⚠️ Vence mañana'
        : `✅ ${layaway.daysLeft} días restantes`

  return (
    <Modal title={`Apartado ${layaway.folio}`} onClose={onClose} size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-1">Cliente</p>
            <p className="font-semibold text-gray-900">{layaway.clientName}</p>

            {layaway.clientPhone && (
              <p className="text-gray-500 text-xs mt-0.5">
                📞 {layaway.clientPhone}
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-1">Estado</p>
            <p className="font-semibold text-gray-900">
              {statusText(layaway.status)}
            </p>

            {layaway.saleFolio && (
              <p className="text-xs text-primary-600 mt-1 font-mono">
                Venta: {layaway.saleFolio}
              </p>
            )}
          </div>

          <div className={`rounded-xl p-3 border ${daysLeftColor}`}>
            <p className="text-xs mb-1 opacity-70">Vigencia</p>
            <p className="font-bold text-sm">{daysLeftLabel}</p>
            <p className="text-xs mt-1 opacity-80">
              Vence:{' '}
              {new Date(layaway.expiresAt).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Productos
          </p>

          <table className="w-full text-sm border rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  Producto
                </th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">
                  Cant.
                </th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">
                  P. Unit.
                </th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">
                  Subtotal
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {layaway.details.map((d, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0 border">
                      {d.imageUrl ? (
                        <img
                          src={d.imageUrl}
                          alt={d.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          📦
                        </div>
                      )}
                    </div>

                    <span className="font-medium text-gray-900">
                      {d.productName}
                    </span>
                  </td>

                  <td className="px-4 py-2.5 text-right text-gray-700">
                    {d.quantity}
                  </td>

                  <td className="px-4 py-2.5 text-right text-gray-700">
                    ${d.unitPrice.toFixed(2)}
                  </td>

                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                    ${d.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Total</p>
            <p className="text-xl font-black text-gray-900">
              ${layaway.total.toFixed(2)}
            </p>
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-xs text-green-500 mb-1">Pagado</p>
            <p className="text-xl font-black text-green-700">
              ${layaway.deposit.toFixed(2)}
            </p>
          </div>

          <div
            className={`rounded-xl p-4 border ${
              layaway.remaining > 0
                ? 'bg-orange-50 border-orange-100'
                : 'bg-green-50 border-green-100'
            }`}
          >
            <p
              className={`text-xs mb-1 ${
                layaway.remaining > 0 ? 'text-orange-500' : 'text-green-500'
              }`}
            >
              Restante
            </p>

            <p
              className={`text-xl font-black ${
                layaway.remaining > 0 ? 'text-orange-700' : 'text-green-700'
              }`}
            >
              ${layaway.remaining.toFixed(2)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Historial de pagos
          </p>

          {!layaway.payments || layaway.payments.length === 0 ? (
            <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-gray-100 text-sm">
              Sin pagos registrados
            </div>
          ) : (
            <div className="space-y-2">
              {layaway.payments.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {layaway.payments.length - idx}
                    </span>

                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {paymentLabel(p.paymentMethod)}
                      </p>

                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.userFullName} ·{' '}
                        {new Date(p.createdAt).toLocaleString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      {p.notes && (
                        <p className="text-xs text-gray-500 mt-0.5 italic">
                          {p.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="font-black text-green-700 text-base">
                    +${p.amount.toFixed(2)}
                  </span>
                </div>
              ))}

              <div className="flex justify-between items-center px-4 py-2 bg-primary-50 rounded-xl border border-primary-100 mt-1">
                <span className="text-sm font-semibold text-primary-700">
                  Total abonado
                </span>
                <span className="font-black text-primary-700">
                  ${layaway.deposit.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
          <p>
            Creado:{' '}
            <span className="text-gray-600 font-medium">
              {new Date(layaway.createdAt).toLocaleString('es-MX')}
            </span>
          </p>

          {layaway.completedAt && (
            <p>
              Cerrado:{' '}
              <span className="text-gray-600 font-medium">
                {new Date(layaway.completedAt).toLocaleString('es-MX')}
              </span>
            </p>
          )}
        </div>

        {canExpire && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-700">
              Este apartado ya está vencido
            </p>

            <p className="text-xs text-red-500 mt-1">
              Al liberarlo, los productos regresan al inventario y los abonos se conservan en el historial.
            </p>

            <button
              type="button"
              onClick={() => expireMutation.mutate()}
              disabled={expireMutation.isPending}
              className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-4 py-2 disabled:opacity-50"
            >
              {expireMutation.isPending
                ? 'Liberando...'
                : 'Liberar producto por vencimiento'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}