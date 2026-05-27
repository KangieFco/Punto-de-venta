import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { cashRegistersApi, type CashRegister, type CashMovement } from '../../api/cashRegisters'
import Modal from '../../components/ui/Modal'
import { useForm } from 'react-hook-form'

export default function CashRegisterPage() {
  const qc = useQueryClient()
  const [openModal,  setOpenModal]  = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [inModal,    setInModal]    = useState(false)
  const [outModal,   setOutModal]   = useState(false)

  const { data: current, isLoading } = useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn:  () => cashRegistersApi.getCurrent().then(r => r.data.data ?? null),
  })

  const { data: movements } = useQuery({
    queryKey: ['cash-movements', current?.id],
    queryFn:  () => current
      ? cashRegistersApi.getMovements(current.id).then(r => r.data.data ?? [])
      : Promise.resolve([]),
    enabled: !!current,
  })

  if (isLoading)
    return <div className="p-8 text-gray-500">Cargando...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Caja</h1>
        <p className="text-gray-500 text-sm mt-1">
          Estado: {current ? '🟢 Abierta' : '🔴 Cerrada'}
        </p>
      </div>

      {!current ? (
        <OpenCashPanel onOpen={() => setOpenModal(true)} />
      ) : (
        <OpenedCashPanel
          register={current}
          movements={movements ?? []}
          onClose={() => setCloseModal(true)}
          onIn={()    => setInModal(true)}
          onOut={()   => setOutModal(true)}
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
          onClose={() => setCloseModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['cash-register'] })
            setCloseModal(false)
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
    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────────

function OpenCashPanel({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="card max-w-sm mx-auto text-center py-12">
      <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
      <h2 className="text-lg font-semibold text-gray-700">No hay caja abierta</h2>
      <p className="text-gray-500 text-sm mt-2 mb-6">
        Abre una caja para comenzar a vender
      </p>
      <button onClick={onOpen} className="btn-primary">
        Abrir caja
      </button>
    </div>
  )
}

function OpenedCashPanel({ register, movements, onClose, onIn, onOut }: {
  register:  CashRegister
  movements: CashMovement[]
  onClose:   () => void
  onIn:      () => void
  onOut:     () => void
}) {
  const totalIn  = movements.filter(m => m.type === 'In').reduce((s,m) => s+m.amount, 0)
  const totalOut = movements.filter(m => m.type === 'Out').reduce((s,m) => s+m.amount, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Fondo inicial</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${register.openingAmount.toFixed(2)}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Ingresos manuales</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            +${totalIn.toFixed(2)}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Retiros</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            -${totalOut.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        <button onClick={onIn}
          className="btn-secondary flex items-center gap-2">
          <ArrowUpCircle size={18} className="text-green-600" /> Ingreso
        </button>
        <button onClick={onOut}
          className="btn-secondary flex items-center gap-2">
          <ArrowDownCircle size={18} className="text-red-600" /> Retiro
        </button>
        <button onClick={onClose}
          className="btn-danger flex items-center gap-2 ml-auto">
          <Lock size={18} /> Cerrar caja
        </button>
      </div>

      {/* Movimientos */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Movimientos del turno</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Motivo</th>
              <th className="text-right px-6 py-3 font-medium text-gray-600">Monto</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {movements.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">
                Sin movimientos
              </td></tr>
            ) : movements.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span className={`font-medium ${
                    m.type === 'In' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {m.type === 'In' ? '↑ Ingreso' : '↓ Retiro'}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">{m.reason ?? '—'}</td>
                <td className="px-6 py-3 text-right font-medium">
                  ${m.amount.toFixed(2)}
                </td>
                <td className="px-6 py-3 text-gray-500">
                  {new Date(m.createdAt).toLocaleTimeString('es-MX')}
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
  onClose: () => void; onSuccess: () => void
}) {
  const { register, handleSubmit } = useForm<{ openingAmount: number }>()

  const mutation = useMutation({
    mutationFn: (d: { openingAmount: number }) =>
      cashRegistersApi.open(d.openingAmount),
    onSuccess: () => { toast.success('Caja abierta'); onSuccess() },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Error'),
  })

  return (
    <Modal title="Abrir caja" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fondo inicial ($)
          </label>
          <input
            {...register('openingAmount', { valueAsNumber: true, min: 0 })}
            type="number" step="0.01"
            className="input" placeholder="0.00" autoFocus
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Abriendo...' : 'Abrir caja'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function CloseRegisterModal({ register: reg, onClose, onSuccess }: {
  register:  CashRegister
  onClose:   () => void
  onSuccess: () => void
}) {
  const { register, handleSubmit } = useForm<{ closingAmount: number }>()

  const mutation = useMutation({
    mutationFn: (d: { closingAmount: number }) =>
      cashRegistersApi.close(reg.id, d.closingAmount),
    onSuccess: () => { toast.success('Caja cerrada'); onSuccess() },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Error'),
  })

  return (
    <Modal title="Cerrar caja" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto contado en caja ($)
          </label>
          <input
            {...register('closingAmount', { valueAsNumber: true, min: 0 })}
            type="number" step="0.01"
            className="input" placeholder="0.00" autoFocus
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending} className="btn-danger">
            {mutation.isPending ? 'Cerrando...' : 'Cerrar caja'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function MovementModal({ type, onClose, onSuccess }: {
  type:      'in' | 'out'
  onClose:   () => void
  onSuccess: () => void
}) {
  const { register, handleSubmit } = useForm<{ amount: number; reason: string }>()

  const mutation = useMutation({
    mutationFn: (d: { amount: number; reason: string }) =>
      type === 'in'
        ? cashRegistersApi.addIncoming(d)
        : cashRegistersApi.addOutgoing(d),
    onSuccess: () => {
      toast.success(type === 'in' ? 'Ingreso registrado' : 'Retiro registrado')
      onSuccess()
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Error'),
  })

  return (
    <Modal
      title={type === 'in' ? 'Registrar ingreso' : 'Registrar retiro'}
      onClose={onClose}
      size="sm"
    >
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto ($)
          </label>
          <input
            {...register('amount', { valueAsNumber: true,
              required: 'Requerido', min: 0.01 })}
            type="number" step="0.01"
            className="input" placeholder="0.00" autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo
          </label>
          <input
            {...register('reason')}
            className="input"
            placeholder="Ej: Compra de cambio"
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