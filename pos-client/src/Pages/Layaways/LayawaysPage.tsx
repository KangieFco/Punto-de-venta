import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Eye, XCircle, DollarSign, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { layawaysApi, type Layaway } from '../../api/layaways'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'
import CreateLayawayModal from './LayawayForm'

export default function LayawaysPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const canCancel = ['Admin', 'Supervisor'].includes(user?.role ?? '')

  const [filter, setFilter] = useState<string>('Pending')
  const [detail, setDetail] = useState<Layaway | null>(null)
  const [creating, setCreating] = useState(false)
  const [depositing, setDepositing] = useState<Layaway | null>(null)

  const { data: layaways, isLoading } = useQuery({
    queryKey: ['layaways', filter],
    queryFn: () =>
      layawaysApi.getAll(filter || undefined).then(r => r.data.data ?? []),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => layawaysApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['layaways'] })
      toast.success('Apartado cancelado')
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Error'),
  })

  const statusVariant = (s: string) =>
    ({
      Pending: 'yellow',
      Completed: 'green',
      Cancelled: 'red',
    }[s] ?? 'gray') as 'yellow' | 'green' | 'red'

  const statusLabel = (s: string) =>
    ({
      Pending: 'Pendiente',
      Completed: 'Completado',
      Cancelled: 'Cancelado',
    }[s] ?? s)

  const tabs = [
    { key: 'Pending', label: 'Pendientes' },
    { key: 'Completed', label: 'Completados' },
    { key: 'Cancelled', label: 'Cancelados' },
    { key: '', label: 'Todos' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apartados</h1>
          <p className="text-gray-500 text-sm mt-1">
            {layaways?.length ?? 0} apartados
          </p>
        </div>

        <button
          onClick={() => setCreating(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Nuevo apartado
        </button>
      </div>

      {/* Tabs de filtro */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === t.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Folio
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Cliente
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Total
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Anticipo
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Restante
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Estado
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Fecha
              </th>
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
                  <td className="px-8 py-6 font-mono font-bold text-primary-600">
                    {l.folio}
                  </td>

                  <td className="px-8 py-6">
                    <div className="font-medium text-black-900">
                      {l.clientName}
                    </div>

                    {l.clientPhone && (
                      <div className="text-sm text-black-400">
                        {l.clientPhone}
                      </div>
                    )}
                  </td>

                  <td className="px-8 py-6 text-right font-bold text-black-900">
                    ${l.total.toFixed(2)}
                  </td>

                  <td className="px-8 py-6 text-right text-green-600 font-medium">
                    ${l.deposit.toFixed(2)}
                  </td>

                  <td className="px-8 py-6 text-right font-bold">
                    <span
                      className={
                        l.remaining > 0 ? 'text-orange-600' : 'text-green-600'
                      }
                    >
                      ${l.remaining.toFixed(2)}
                    </span>
                  </td>

                  <td className="px-8 py-6">
                    <Badge
                      label={statusLabel(l.status)}
                      variant={statusVariant(l.status)}
                    />
                  </td>

                  <td className="px-8 py-6 text-gray-500 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleDateString('es-MX')}
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setDetail(l)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Ver detalle"
                      >
                        <Eye size={24} className="text-gray-500" />
                      </button>

                      {l.status === 'Pending' && (
                        <button
                          onClick={() => setDepositing(l)}
                          className="p-2 hover:bg-green-50 rounded-lg"
                          title="Agregar abono"
                        >
                          <DollarSign size={24} className="text-green-600" />
                        </button>
                      )}

                      {canCancel && l.status === 'Pending' && (
                        <button
                          onClick={() => cancelMutation.mutate(l.id)}
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

      {/* Modales */}
      {creating && (
        <CreateLayawayModal
          onClose={() => setCreating(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['layaways'] })
            setCreating(false)
          }}
        />
      )}

      {detail && (
        <LayawayDetailModal layaway={detail} onClose={() => setDetail(null)} />
      )}

      {depositing && (
        <AddDepositModal
          layaway={depositing}
          onClose={() => setDepositing(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['layaways'] })
            setDepositing(null)
          }}
        />
      )}
    </div>
  )
}

//Modal detalle

function LayawayDetailModal({
  layaway,
  onClose,
}: {
  layaway: Layaway
  onClose: () => void
}) {
  const statusColors: Record<string, string> = {
    Pending: 'text-yellow-600 bg-yellow-50',
    Completed: 'text-green-600 bg-green-50',
    Cancelled: 'text-red-600 bg-red-50',
  }
  return (
    <Modal title={`Apartado ${layaway.folio}`} onClose={onClose} size="lg">
      <div className="space-y-5">
        {/* Info cliente */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-sm mb-1">Cliente</p>
            <p className="font-semibold text-gray-900">{layaway.clientName}</p>

            {layaway.clientPhone && (
              <p className="text-gray-500">{layaway.clientPhone}</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-sm mb-1">Estado</p>

            <span
              className={`inline-block px-2 py-0.5 rounded-full text-sm font-semibold ${
                statusColors[layaway.status]
              }`}
            >
              {
                {
                  Pending: 'Pendiente',
                  Completed: 'Completado',
                  Cancelled: 'Cancelado',
                }[layaway.status]
              }
            </span>

            <p className="text-black-500 mt-1 text-sm">
              {new Date(layaway.createdAt).toLocaleString('es-MX')}
            </p>
          </div>
        </div>

        {/* Productos */}
        <table className="w-full text-sm border rounded-xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-black-600">
                Producto
              </th>
              <th className="text-right px-4 py-2 font-medium text-black-600">
                Cant.
              </th>
              <th className="text-right px-4 py-2 font-medium text-black-600">
                P. Unit.
              </th>
              <th className="text-right px-4 py-2 font-medium text-black-600">
                Subtotal
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {layaway.details.map((d, i) => (
              <tr key={i}>
                <td className="px-4 py-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0">
                    {d.imageUrl ? (
                      <img
                        src={d.imageUrl}
                        alt={d.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package
                        size={14}
                        className="m-auto mt-1.5 text-gray-300"
                      />
                    )}
                  </div>

                  {d.productName}
                </td>

                <td className="px-4 py-2 text-right">{d.quantity}</td>

                <td className="px-8 py-6 text-right">
                  ${d.unitPrice.toFixed(2)}
                </td>

                <td className="px-8 py-6 text-right font-medium">
                  ${d.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Resumen financiero */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Total</p>
            <p className="text-xl font-black text-gray-900">
              ${layaway.total.toFixed(2)}
            </p>
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-green-500 mb-1">Pagado</p>
            <p className="text-xl font-black text-green-700">
              ${layaway.deposit.toFixed(2)}
            </p>
          </div>

          <div
            className={`rounded-xl p-4 ${
              layaway.remaining > 0 ? 'bg-orange-50' : 'bg-green-50'
            }`}
          >
            <p
              className={`text-sm mb-1 ${
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
      </div>
    </Modal>
  )
}

//Modal agregar abono 

function AddDepositModal({
  layaway,
  onClose,
  onSuccess,
}: {
  layaway: Layaway
  onClose: () => void
  onSuccess: () => void
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ amount: number }>()

  const amount = Number(watch('amount')) || 0
  const mutation = useMutation({
    mutationFn: (d: { amount: number }) =>
      layawaysApi.addDeposit(layaway.id, d.amount),

    onSuccess: () => {
      toast.success('Abono registrado')
      onSuccess()
    },

    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Error'),
  })

  const newRemaining = Math.max(0, layaway.remaining - amount)

  return (
    <Modal title="Agregar abono" onClose={onClose} size="sm">
      <div className="mb-4 bg-gray-50 rounded-xl p-4 text-sm space-y-1">
        <div className="flex justify-between text-gray-600">
          <span>Total apartado</span>
          <span className="font-medium">${layaway.total.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-green-600">
          <span>Ya pagado</span>
          <span className="font-medium">${layaway.deposit.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-orange-600 font-bold">
          <span>Restante</span>
          <span>${layaway.remaining.toFixed(2)}</span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(d => mutation.mutate(d))}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto del abono $
          </label>

          <input
            {...register('amount', {
              valueAsNumber: true,
              required: 'Requerido',
              min: {
                value: 0.01,
                message: 'Debe ser mayor a 0',
              },
              max: {
                value: layaway.remaining,
                message: 'No puede superar el restante',
              },
            })}
            type="text"
            inputMode="decimal"
            className="input text-xl font-bold text-center"
            placeholder={layaway.remaining.toFixed(2)}
            autoFocus
          />

          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">
              {errors.amount.message}
            </p>
          )}
        </div>

        {amount > 0 && (
          <div
            className={`rounded-xl p-3 text-center text-sm font-medium ${
              newRemaining === 0
                ? 'bg-green-50 text-green-700'
                : 'bg-orange-50 text-orange-700'
            }`}
          >
            {newRemaining === 0
              ? 'El apartado queda completado'
              : `Restará: $${newRemaining.toFixed(2)}`}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Guardando...' : 'Registrar abono'}
          </button>
        </div>
      </form>
    </Modal>
  )
}