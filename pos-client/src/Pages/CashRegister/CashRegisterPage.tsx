import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Lock, TrendingUp, Receipt, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { cashRegistersApi, type CashRegister, type CashMovement, type CashRegisterCloseResult } from '../../api/cashRegisters'
import Modal from '../../components/ui/Modal'

export default function CashRegisterPage() {
  const qc = useQueryClient()
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [inModal, setInModal] = useState(false)
  const [outModal, setOutModal] = useState(false)
  const [closeResult, setCloseResult] = useState<CashRegisterCloseResult | null>(null)
  const { data: current, isLoading } = useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn: () => cashRegistersApi.getCurrent().then(r => r.data.data ?? null),
  })
  const { data: movements } = useQuery({
    queryKey: ['cash-movements', current?.id],
    queryFn: () =>
      current
        ? cashRegistersApi.getMovements(current.id).then(r => r.data.data ?? [])
        : Promise.resolve([]), enabled: !!current,
  })

  if (isLoading)
    return <div className="p-8 text-gray-400">Cargando...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black-900">Caja</h1>
        <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            current ? 'bg-green-500' : 'bg-red-400'
          }`} />
          {current ? 'Abierta' : 'Cerrada'}
        </p>
      </div>

      {!current ? (
        <ClosedPanel onOpen={() => setOpenModal(true)} />
      ) : (
        <OpenedPanel
          register={current}
          movements={movements ?? []}
          onClose={() => setCloseModal(true)}
          onIn={() => setInModal(true)}
          onOut={() => setOutModal(true)}
        />
      )}

      {openModal && (
        <OpenRegisterModal
          onClose={() => setOpenModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['cash-register'] })
            setOpenModal(false)
          }}
        />
      )}

      {closeModal && current && (
        <CloseRegisterModal
          register={current}
          movements={movements ?? []}
          onClose={() => setCloseModal(false)}
          onSuccess={(result) => {
            qc.invalidateQueries({ queryKey: ['cash-register'] })
            qc.invalidateQueries({ queryKey: ['cash-movements'] })
            setCloseModal(false)
            setCloseResult(result)
          }}
        />
      )}

      {inModal && (
        <MovementModal
          type="in"
          onClose={() => setInModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['cash-movements'] })
            setInModal(false)
          }}
        />
      )}

      {outModal && (
        <MovementModal
          type="out"
          onClose={() => setOutModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['cash-movements'] })
            setOutModal(false)
          }}
        />
      )}

      {closeResult && (
        <CloseResultModal
          result={closeResult}
          onClose={() => setCloseResult(null)}
        />
      )}
    </div>
  )
}

function ClosedPanel({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="card max-w-sm mx-auto text-center py-16">
      <DollarSign size={56} className="mx-auto text-black-200 mb-4" />
      <h2 className="text-lg font-semibold text-black-600">
        No hay caja abierta
      </h2>
      <p className="text-gray-400 text-sm mt-2 mb-8">
        Abre una caja para comenzar a operar
      </p>
      <button onClick={onOpen} className="btn-primary px-8">
        Abrir caja
      </button>
    </div>
  )
}

function OpenedPanel({ register, movements, onClose, onIn, onOut }: {
  register: CashRegister
  movements: CashMovement[]
  onClose: () => void
  onIn: () => void
  onOut: () => void
}) {
  const totalIn = movements
    .filter(m => m.type === 'In')
    .reduce((s, m) => s + m.amount, 0)

  const totalOut = movements
    .filter(m => m.type === 'Out')
    .reduce((s, m) => s + m.amount, 0)

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
            ) : movements.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span className={`font-medium ${
                    m.type === 'In' ? 'text-green-600' : 'text-red-600'
                  }`}>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OpenRegisterModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: () => void
}) {
  const { register, handleSubmit } =
    useForm<{ openingAmount: string }>({
      defaultValues: { openingAmount: '' }
    })

  const mutation = useMutation({
    mutationFn: (d: { openingAmount: string }) =>
      cashRegistersApi.open(Number(d.openingAmount)),
    onSuccess: () => {
      toast.success('Caja abierta')
      onSuccess()
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? 'Error'),
  })

  return (
    <Modal title="Abrir caja" onClose={onClose} size="sm">
      <form
        onSubmit={handleSubmit(d => mutation.mutate(d))}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-black-700 mb-1">
            Fondo inicial ($)
          </label>
          <input
            {...register('openingAmount', { required: 'Requerido' })}
            type="text"
            inputMode="decimal"
            className="input text-xl font-bold text-center"
            autoFocus
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Abriendo...' : 'Abrir caja'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function CloseRegisterModal({ register: reg, movements, onClose, onSuccess }: {
  register: CashRegister
  movements: CashMovement[]
  onClose: () => void
  onSuccess: (result: CashRegisterCloseResult) => void
}) {
  const { register, handleSubmit, watch } =
    useForm<{ closingAmount: string }>({
      defaultValues: { closingAmount: '' }
    })

  const closing = Number(watch('closingAmount')) || 0

  const totalIn = movements
    .filter(m => m.type === 'In')
    .reduce((s, m) => s + m.amount, 0)

  const totalOut = movements
    .filter(m => m.type === 'Out')
    .reduce((s, m) => s + m.amount, 0)

  const expectedCash = reg.openingAmount + totalIn - totalOut
  const diff = closing - expectedCash

  const mutation = useMutation({
    mutationFn: (d: { closingAmount: string }) =>
      cashRegistersApi.close(reg.id, Number(d.closingAmount)),
    onSuccess: (res) => {
      toast.success('Caja cerrada')
      onSuccess(res.data.data!)
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? 'Error'),
  })

  return (
    <Modal title="Cerrar caja" onClose={onClose} size="sm">
      <form
        onSubmit={handleSubmit(d => mutation.mutate(d))}
        className="space-y-4"
      >
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-black-600">
            <span>Fondo inicial</span>
            <span>${reg.openingAmount.toFixed(2)}</span>
          </div>

          {totalIn > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Ingresos manuales</span>
              <span>+${totalIn.toFixed(2)}</span>
            </div>
          )}

          {totalOut > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Retiros</span>
              <span>-${totalOut.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
            <span>Efectivo esperado</span>
            <span>${expectedCash.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-black-700 mb-1">
            Monto contado en caja ($)
          </label>
          <input
            {...register('closingAmount', { required: 'Requerido' })}
            type="text"
            inputMode="decimal"
            className="input text-xl font-bold text-center"
            placeholder={expectedCash.toFixed(2)}
            autoFocus
          />
        </div>

        {closing > 0 && (
          <div className={`rounded-xl p-3 text-center text-sm font-semibold
            ${diff === 0
              ? 'bg-green-50 text-green-700 border border-green-200'
              : diff > 0
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            {diff === 0 && '✅ Caja cuadrada perfectamente'}
            {diff > 0 && `📈 Sobrante: +$${diff.toFixed(2)}`}
            {diff < 0 && `📉 Faltante: -$${Math.abs(diff).toFixed(2)}`}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-danger"
          >
            {mutation.isPending ? 'Cerrando...' : 'Cerrar y ver resumen'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function CloseResultModal({ result, onClose }: {
  result: CashRegisterCloseResult
  onClose: () => void
}) {
  const diffColor = result.difference === 0
    ? 'text-green-600'
    : result.difference > 0
      ? 'text-blue-600'
      : 'text-red-600'

  const diffLabel = result.difference === 0
    ? '✅ Cuadrada'
    : result.difference > 0
      ? `+$${result.difference.toFixed(2)} sobrante`
      : `-$${Math.abs(result.difference).toFixed(2)} faltante`

  const duration = Math.round(
    (new Date(result.closedAt).getTime() -
     new Date(result.openedAt).getTime()) / 60000
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
              {hours > 0 ? `${hours}h ` : ''}{minutes}min
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

            <div className={`flex justify-between font-black text-base border-t border-gray-300 pt-2 ${diffColor}`}>
              <span>Diferencia</span>
              <span>{diffLabel}</span>
            </div>
          </div>
        </div>

        {result.difference !== 0 && (
          <div className={`flex items-start gap-3 rounded-xl p-4
            ${result.difference < 0
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
            }`}>
            <AlertCircle size={18} className={
              result.difference < 0 ? 'text-red-500' : 'text-blue-500'
            } />

            <p className={`text-sm ${
              result.difference < 0 ? 'text-red-700' : 'text-blue-700'
            }`}>
              {result.difference < 0
                ? `Hay un faltante de $${Math.abs(result.difference).toFixed(2)}. Revisa los movimientos del turno.`
                : `Hay un sobrante de $${result.difference.toFixed(2)}. Puede ser propina u otro ingreso no registrado.`
              }
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
                    <span className={`font-medium ${
                      m.type === 'In' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {m.type === 'In' ? '↑' : '↓'} {m.reason ?? '—'}
                    </span>

                    <p className="text-xs text-gray-400">
                      {new Date(m.createdAt).toLocaleTimeString('es-MX', {
                        timeZone: 'America/Chihuahua',
                      })}
                    </p>
                  </div>

                  <span className={`font-bold ${
                    m.type === 'In' ? 'text-green-700' : 'text-red-700'
                  }`}>
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

function MovementModal({ type, onClose, onSuccess }: {
  type: 'in' | 'out'
  onClose: () => void
  onSuccess: () => void
}) {
  const { register, handleSubmit } =
    useForm<{ amount: string; reason: string }>({
      defaultValues: {
        amount: '',
        reason: '',
      }
    })

  const mutation = useMutation({
    mutationFn: (d: { amount: string; reason: string }) =>
      type === 'in'
        ? cashRegistersApi.addIncoming({
            amount: Number(d.amount),
            reason: d.reason,
          })
        : cashRegistersApi.addOutgoing({
            amount: Number(d.amount),
            reason: d.reason,
          }),
    onSuccess: () => {
      toast.success(type === 'in' ? 'Ingreso registrado' : 'Retiro registrado')
      onSuccess()
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? 'Error'),
  })

  return (
    <Modal
      title={type === 'in' ? 'Registrar ingreso' : 'Registrar retiro'}
      onClose={onClose}
      size="sm"
    >
      <form
        onSubmit={handleSubmit(d => mutation.mutate(d))}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto ($)
          </label>
          <input
            {...register('amount', { required: 'Requerido' })}
            type="text"
            inputMode="decimal"
            className="input text-xl font-bold text-center"
            placeholder="0.00"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo
          </label>
          <input
            {...register('reason')}
            className="input"
            placeholder="Ej: Cambio para caja"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className={type === 'in' ? 'btn-primary' : 'btn-danger'}
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function StatCard({ label, value, color, small }: {
  label: string
  value: string
  color: string
  small?: boolean
}) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-50 border-gray-100',
    green: 'bg-green-50 border-green-100',
    red: 'bg-red-50 border-red-100',
    blue: 'bg-blue-50 border-blue-100',
  }

  const text: Record<string, string> = {
    gray: 'text-gray-800',
    green: 'text-green-800',
    red: 'text-red-800',
    blue: 'text-blue-800',
  }

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-black ${small ? 'text-sm' : 'text-xl'} ${text[color]}`}>
        {value}
      </p>
    </div>
  )
}