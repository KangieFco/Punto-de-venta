import { Eye, XCircle, DollarSign } from 'lucide-react'
import type { Layaway } from '../../../src/api/layaways'
import Badge from '../../../src/components/ui/Badge'
import { statusLabel, statusVariant } from '../../../src/utils/layawayHelpers'

type Props = {
  layaways: Layaway[] | undefined
  isLoading: boolean
  canCancel: boolean
  onDetail: (layaway: Layaway) => void
  onDeposit: (layaway: Layaway) => void
  onCancel: (id: number) => void
}

export default function LayawaysTable({
  layaways,
  isLoading,
  canCancel,
  onDetail,
  onDeposit,
  onCancel,
}: Props) {
  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Folio</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Anticipo</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Restante</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={8} className="text-center py-12 text-gray-400">
                Cargando...
              </td>
            </tr>
          ) : layaways?.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-12 text-gray-400">
                Sin apartados
              </td>
            </tr>
          ) : (
            layaways?.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-8 py-6 font-mono font-bold text-primary-600"> {l.folio} </td>
                <td className="px-8 py-6">
                  <div className="font-medium text-gray-900">{l.clientName}</div> {l.clientPhone && (
                    <div className="text-sm text-gray-500">{l.clientPhone}</div> )}
                </td>
                <td className="px-8 py-6 text-right font-bold text-gray-900"> ${l.total.toFixed(2)} </td>
                <td className="px-8 py-6 text-right text-green-600 font-medium"> ${l.deposit.toFixed(2)} </td>
                <td className="px-8 py-6 text-right font-bold">
                  <span className={l.remaining > 0 ? 'text-orange-600' : 'text-green-600'}>
                    ${l.remaining.toFixed(2)}
                  </span>
                </td>

                <td className="px-8 py-6">
                  <Badge label={statusLabel(l.status)} variant={statusVariant(l.status)} />
                </td>

                <td className="px-8 py-6 text-gray-500 whitespace-nowrap">
                  {new Date(l.createdAt).toLocaleDateString('es-MX')}
                </td>

                <td className="px-8 py-6">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => onDetail(l)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Ver detalle"
                    >
                      <Eye size={24} className="text-gray-500" />
                    </button>

                    {l.status === 'Pending' && (
                      <button
                        onClick={() => onDeposit(l)}
                        className="p-2 hover:bg-green-50 rounded-lg"
                        title="Agregar abono"
                      >
                        <DollarSign size={24} className="text-green-600" />
                      </button>
                    )}

                    {canCancel && l.status === 'Pending' && (
                      <button
                        onClick={() => onCancel(l.id)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                        title="Cancelar"
                      >
                        <XCircle size={24} className="text-red-500" />
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