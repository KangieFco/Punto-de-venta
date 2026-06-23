import { Eye, XCircle } from 'lucide-react'
import type { Sale } from '../../api/sales'
import Badge from '../../../src/components/ui/Badge'
import { formatPaymentMethod } from '../../utils/salesFormatters'

type Props = {
  sales: Sale[]
  filteredCount: number
  isLoading: boolean
  canCancel: boolean
  onDetail: (sale: Sale) => void
  onCancel: (sale: Sale) => void
}

export default function SalesTable({
  sales,
  filteredCount,
  isLoading,
  canCancel,
  onDetail,
  onCancel,
}: Props) {
  return (
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
            <th className="text-left px-4 py-4 font-bold text-black">Folio</th>
            <th className="text-left px-4 py-4 font-bold text-black">Cajero</th>
            <th className="text-left px-4 py-4 font-bold text-black">Total</th>
            <th className="text-left px-4 py-4 font-bold text-black">Pago</th>
            <th className="text-left px-4 py-4 font-bold text-black">Estado</th>
            <th className="text-left px-4 py-4 font-bold text-black">Fecha</th>
            <th className="px-8 py-4" />
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-black text-lg">
                Cargando...
              </td>
            </tr>
          ) : filteredCount === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-black text-lg">
                Sin ventas
              </td>
            </tr>
          ) : (
            sales.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-8 py-6 font-mono font-bold text-primary-600 text-base">
                  {s.folio}
                </td>

                <td className="px-8 py-6 text-left text-gray-700 font-medium">
                  {s.userFullName}
                </td>

                <td className="px-8 py-6 text-left text-gray-700 font-medium">
                  ${s.total.toFixed(2)}
                </td>

                <td className="px-8 py-6 text-gray-700 text-left">
                  {formatPaymentMethod(s.paymentMethod)}
                </td>

                <td className="px-8 py-6 text-left">
                  <Badge
                    label={s.status === 'Completed' ? 'Completada' : 'Cancelada'}
                    variant={s.status === 'Completed' ? 'green' : 'red'}
                  />
                </td>

                <td className="px-8 py-6 text-left text-gray-700 font-medium">
                  {new Date(s.createdAt).toLocaleString('es-MX')}
                </td>

                <td className="px-8 py-6">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onDetail(s)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Ver detalle"
                    >
                      <Eye size={28} className="text-gray-500" />
                    </button>

                    {canCancel && s.status === 'Completed' && (
                      <button
                        onClick={() => onCancel(s)}
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
  )
}