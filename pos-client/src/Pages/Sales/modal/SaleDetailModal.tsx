import type { Sale } from '../../../api/sales'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import { formatPaymentMethod, parsePaymentBreakdown } from '../../../utils/salesFormatters'
import { formatDateTime } from '../../../utils/date'

type Props = {
  sale: Sale
  onClose: () => void
}

export default function SaleDetailModal({ sale, onClose }: Props) {
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
              {formatDateTime(sale.createdAt)}
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
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Producto</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Cant.</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">P. Unit.</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sale.details.map((d, i) => (
              <tr key={i}>
                <td className="px-4 py-3">{d.productName}</td>
                <td className="px-4 py-3 text-right">{d.quantity}</td>
                <td className="px-4 py-3 text-right"> ${d.unitPrice.toFixed(2)} </td>
                <td className="px-4 py-3 text-right font-medium"> ${d.subtotal.toFixed(2)} </td>
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