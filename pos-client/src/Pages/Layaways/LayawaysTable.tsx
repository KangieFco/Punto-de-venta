import {
  DollarSign,
  Eye,
  XCircle,
} from 'lucide-react'

import type { Layaway } from '../../api/layaways'
import Badge from '../../components/ui/Badge'
import {
  statusLabel,
  statusVariant,
} from '../../utils/layawayHelpers'

type Props = {
  layaways:
    | Layaway[]
    | undefined

  isLoading: boolean
  canCancel: boolean

  onDetail: (
    layaway: Layaway,
  ) => void

  onDeposit: (
    layaway: Layaway,
  ) => void

  onCancel: (
    id: number,
  ) => void
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
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Folio
            </th>

            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Cliente
            </th>

            <th className="px-4 py-3 text-right font-medium text-gray-600">
              Total
            </th>

            <th className="px-4 py-3 text-right font-medium text-gray-600">
              Anticipo
            </th>

            <th className="px-4 py-3 text-right font-medium text-gray-600">
              Restante
            </th>

            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Estado
            </th>

            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Fecha
            </th>

            <th className="px-4 py-3" />
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td
                colSpan={8}
                className="py-12 text-center text-gray-400"
              >
                Cargando...
              </td>
            </tr>
          ) : !layaways ||
            layaways.length ===
              0 ? (
            <tr>
              <td
                colSpan={8}
                className="py-12 text-center text-gray-400"
              >
                Sin apartados
              </td>
            </tr>
          ) : (
            layaways.map(
              layaway => (
                <tr
                  key={
                    layaway.id
                  }
                  className="hover:bg-gray-50"
                >
                  <td className="px-8 py-6 font-mono font-bold text-primary-600">
                    {
                      layaway.folio
                    }
                  </td>

                  <td className="px-8 py-6">
                    <div className="font-medium text-gray-900">
                      {
                        layaway.clientName
                      }
                    </div>

                    {layaway.clientPhone && (
                      <div className="text-sm text-gray-500">
                        {
                          layaway.clientPhone
                        }
                      </div>
                    )}
                  </td>

                  <td className="px-8 py-6 text-right font-bold text-gray-900">
                    $
                    {layaway.total.toFixed(
                      2,
                    )}
                  </td>

                  <td className="px-8 py-6 text-right font-medium text-green-600">
                    $
                    {layaway.deposit.toFixed(
                      2,
                    )}
                  </td>

                  <td className="px-8 py-6 text-right font-bold">
                    <span
                      className={
                        layaway.remaining >
                        0
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }
                    >
                      $
                      {layaway.remaining.toFixed(
                        2,
                      )}
                    </span>
                  </td>

                  <td className="px-8 py-6">
                    <Badge
                      label={statusLabel(
                        layaway.status,
                      )}
                      variant={statusVariant(
                        layaway.status,
                      )}
                    />
                  </td>

                  <td className="whitespace-nowrap px-8 py-6 text-gray-500">
                    {new Date(
                      layaway.createdAt,
                    ).toLocaleDateString(
                      'es-MX',
                      {
                        timeZone:
                          'America/Chihuahua',
                      },
                    )}
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onDetail(
                            layaway,
                          )
                        }
                        className="rounded-lg p-2 hover:bg-gray-100"
                        title="Ver detalle"
                      >
                        <Eye
                          size={24}
                          className="text-gray-500"
                        />
                      </button>

                      {layaway.status ===
                        'Pending' &&
                        !layaway.isExpired && (
                          <button
                            type="button"
                            onClick={() =>
                              onDeposit(
                                layaway,
                              )
                            }
                            className="rounded-lg p-2 hover:bg-green-50"
                            title="Agregar abono"
                          >
                            <DollarSign
                              size={
                                24
                              }
                              className="text-green-600"
                            />
                          </button>
                        )}

                      {canCancel &&
                        layaway.status ===
                          'Pending' && (
                          <button
                            type="button"
                            onClick={() =>
                              onCancel(
                                layaway.id,
                              )
                            }
                            className="rounded-lg p-2 hover:bg-red-50"
                            title="Cancelar"
                          >
                            <XCircle
                              size={
                                24
                              }
                              className="text-red-500"
                            />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ),
            )
          )}
        </tbody>
      </table>
    </div>
  )
}