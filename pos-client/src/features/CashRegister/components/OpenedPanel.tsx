import { ArrowDownCircle, ArrowUpCircle, Lock } from 'lucide-react'
import { type CashRegister, type CashMovement } from '../../../api/cashRegisters'
import StatCard from './StatCard'
import MovementsTable from '../../../Pages/CashRegister/MovementsTable'
import { getTotalIn, getTotalOut } from '../../../../src/utils/cashRegisterCalculations'

interface Props {
  register: CashRegister
  movements: CashMovement[]
  onClose: () => void
  onIn: () => void
  onOut: () => void
}

export default function OpenedPanel({
  register,
  movements,
  onClose,
  onIn,
  onOut,
}: Props) {
  const totalIn = getTotalIn(movements)
  const totalOut = getTotalOut(movements)

  const since = new Date(register.openedAt).toLocaleString('es-MX', {
    timeZone: 'America/Chihuahua',
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Fondo inicial"
          value={`$${register.openingAmount.toFixed(2)}`}
          color="gray"
        />

        <StatCard
          label="Ingresos manuales"
          value={`+$${totalIn.toFixed(2)}`}
          color="green"
        />

        <StatCard
          label="Retiros"
          value={`-$${totalOut.toFixed(2)}`}
          color="red"
        />

        <StatCard
          label="Turno desde"
          value={since}
          color="blue"
          small
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={onIn}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowUpCircle size={24} className="text-green-600" />
          Ingreso manual
        </button>

        <button
          onClick={onOut}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowDownCircle size={24} className="text-red-600" />
          Retiro manual
        </button>

        <button
          onClick={onClose}
          className="btn-danger flex items-center gap-2 ml-auto"
        >
          <Lock size={24} />
          Cerrar caja y ver resumen
        </button>
      </div>

      <MovementsTable movements={movements} />
    </div>
  )
}