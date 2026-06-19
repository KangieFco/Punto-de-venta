import { AlertCircle, DollarSign, Receipt, TrendingUp } from 'lucide-react'
import { type CashRegisterCloseResult } from '../../../api/cashRegisters'
import Modal from '../../../components/ui/Modal'

interface Props {
  result: CashRegisterCloseResult
  onClose: () => void
}

export default function CloseResultModal({ result, onClose }: Props) {
  const diffColor =
    result.difference === 0
      ? 'text-green-600'
      : result.difference > 0
        ? 'text-blue-600'
        : 'text-red-600'

  const diffLabel =
    result.difference === 0
      ? '✅ Cuadrada'
      : result.difference > 0
        ? `+$${result.difference.toFixed(2)} sobrante`
        : `-$${Math.abs(result.difference).toFixed(2)} faltante`

  const duration = Math.round(
    (new Date(result.closedAt).getTime() -
      new Date(result.openedAt).getTime()) /
      60000
  )

  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  return (
    <Modal title="📋 Resumen de cierre de caja" onClose={onClose} size="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-1">Cajero</p>
            <p className="font-semibold text-gray-900">
              {result.userFullName}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-1">Duración del turno</p>
            <p className="font-semibold text-gray-900">
              {hours > 0 ? `${hours}h ` : ''}
              {minutes}min
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-1">Apertura</p>
            <p className="font-medium text-gray-700">
              {new Date(result.openedAt).toLocaleString('es-MX', {
                timeZone: 'America/Chihuahua',
              })}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-1">Cierre</p>
            <p className="font-medium text-gray-700">
              {new Date(result.closedAt).toLocaleString('es-MX', {
                timeZone: 'America/Chihuahua',
              })}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-600" />
            Ventas del turno
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-green-600 mb-1">💵 Efectivo</p>
              <p className="text-lg font-black text-green-800">
                ${result.cashRevenue.toFixed(2)}
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-600 mb-1">💳 Tarjeta</p>
              <p className="text-lg font-black text-blue-800">
                ${result.cardRevenue.toFixed(2)}
              </p>
            </div>

            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-xs text-purple-600 mb-1">🇺🇸 Dólares</p>
              <p className="text-lg font-black text-purple-800">
                ${result.dollarRevenue.toFixed(2)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">🔄 Otro</p>
              <p className="text-lg font-black text-gray-800">
                ${result.otherRevenue.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-3 bg-primary-50 rounded-xl p-3 flex justify-between items-center">
            <div className="text-sm text-primary-700">
              <span className="font-bold">{result.totalSales}</span>
              {' '}ventas completadas
              {result.cancelledSales > 0 && (
                <span className="text-red-500 ml-2">
                  ({result.cancelledSales} canceladas)
                </span>
              )}
            </div>

            <span className="text-xl font-black text-primary-700">
              ${result.totalRevenue.toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign size={16} className="text-green-600" />
            Conteo de efectivo
          </h3>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Fondo inicial</span>
              <span className="font-medium">
                ${result.openingAmount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-green-700">
              <span>+ Ventas en efectivo</span>
              <span className="font-medium">
                +${result.cashRevenue.toFixed(2)}
              </span>
            </div>

            {result.manualIncoming > 0 && (
              <div className="flex justify-between text-green-600">
                <span>+ Ingresos manuales</span>
                <span className="font-medium">
                  +${result.manualIncoming.toFixed(2)}
                </span>
              </div>
            )}

            {result.manualOutgoing > 0 && (
              <div className="flex justify-between text-red-600">
                <span>- Retiros</span>
                <span className="font-medium">
                  -${result.manualOutgoing.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
              <span>Efectivo esperado en caja</span>
              <span>${result.expectedCash.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-bold text-gray-900">
              <span>Efectivo contado</span>
              <span>${result.closingAmount.toFixed(2)}</span>
            </div>

            <div
              className={`flex justify-between font-black text-base border-t border-gray-300 pt-2 ${diffColor}`}
            >
              <span>Diferencia</span>
              <span>{diffLabel}</span>
            </div>
          </div>
        </div>

        {result.difference !== 0 && (
          <div
            className={`flex items-start gap-3 rounded-xl p-4 ${
              result.difference < 0
                ? 'bg-red-50 border border-red-200'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <AlertCircle
              size={18}
              className={
                result.difference < 0 ? 'text-red-500' : 'text-blue-500'
              }
            />

            <p
              className={`text-sm ${
                result.difference < 0 ? 'text-red-700' : 'text-blue-700'
              }`}
            >
              {result.difference < 0
                ? `Hay un faltante de $${Math.abs(result.difference).toFixed(2)}. Revisa los movimientos del turno.`
                : `Hay un sobrante de $${result.difference.toFixed(2)}. Puede ser propina u otro ingreso no registrado.`}
            </p>
          </div>
        )}

        {result.movements.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Receipt size={16} className="text-gray-500" />
              Movimientos manuales ({result.movements.length})
            </h3>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {result.movements.map(m => (
                <div
                  key={m.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2 text-sm"
                >
                  <div>
                    <span
                      className={`font-medium ${
                        m.type === 'In' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {m.type === 'In' ? '↑' : '↓'} {m.reason ?? '—'}
                    </span>

                    <p className="text-xs text-gray-400">
                      {new Date(m.createdAt).toLocaleTimeString('es-MX', {
                        timeZone: 'America/Chihuahua',
                      })}
                    </p>
                  </div>

                  <span
                    className={`font-bold ${
                      m.type === 'In' ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {m.type === 'In' ? '+' : '-'}${m.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} className="btn-primary w-full py-3">
          Aceptar
        </button>
      </div>
    </Modal>
  )
}