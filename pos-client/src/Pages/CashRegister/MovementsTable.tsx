import { type CashMovement } from '../../api/cashRegisters'

interface Props {
  movements: CashMovement[]
}

export default function MovementsTable({ movements }: Props) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold text-gray-900">
          Movimientos del turno
        </h3>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-center px-4 py-4 font-bold text-black">Tipo</th>
            <th className="text-center px-4 py-4 font-bold text-black">Motivo</th>
            <th className="text-center px-4 py-4 font-bold text-black">Monto</th>
            <th className="text-center px-4 py-4 font-bold text-black">Hora</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {movements.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8 text-black-400">
                Sin movimientos manuales
              </td>
            </tr>
          ) : (
            movements.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span
                    className={`font-medium ${
                      m.type === 'In' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {m.type === 'In' ? '↑ Ingreso' : '↓ Retiro'}
                  </span>
                </td>

                <td className="px-8 py-6 text-center text-black-700 font-medium">
                  {m.reason ?? '—'}
                </td>

                <td className="px-8 py-6 text-center text-black-700 font-medium">
                  ${m.amount.toFixed(2)}
                </td>

                <td className="px-8 py-6 text-center text-black-800 font-medium">
                  {new Date(m.createdAt).toLocaleTimeString('es-MX', {
                    timeZone: 'America/Chihuahua',
                  })}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}