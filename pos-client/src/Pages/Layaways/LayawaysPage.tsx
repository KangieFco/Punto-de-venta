import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Eye, XCircle, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { layawaysApi, type Layaway } from '../../api/layaways'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

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
      Expired: 'red',
    }[s] ?? 'red') as 'yellow' | 'green' | 'red'

  const statusLabel = (s: string) =>
    ({
      Pending: 'Pendiente',
      Completed: 'Completado',
      Cancelled: 'Cancelado',
      Expired: 'Vencido',
    }[s] ?? s)

  const tabs = [
    { key: 'Pending', label: 'Pendientes' },
    { key: 'Completed', label: 'Completados' },
    { key: 'Cancelled', label: 'Cancelados' },
    { key: 'Expired', label: 'Vencidos' },
    { key: '', label: 'Todos' },
  ]

  return (
    <div className="p-8">
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
                  <td className="px-8 py-6 font-mono font-bold text-primary-600">
                    {l.folio}
                  </td>

                  <td className="px-8 py-6">
                    <div className="font-medium text-gray-900">{l.clientName}</div>
                    {l.clientPhone && (
                      <div className="text-sm text-gray-500">{l.clientPhone}</div>
                    )}
                  </td>

                  <td className="px-8 py-6 text-right font-bold text-gray-900">
                    ${l.total.toFixed(2)}
                  </td>

                  <td className="px-8 py-6 text-right text-green-600 font-medium">
                    ${l.deposit.toFixed(2)}
                  </td>

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

function LayawayDetailModal({
  layaway,
  onClose,
}: {
  layaway: Layaway
  onClose: () => void
}) {
  const paymentLabel = (method: string) =>
    ({
      Cash: '💵 Efectivo',
      Card: '💳 Tarjeta',
      Dollar: '🇺🇸 Dólares',
    }[method] ?? method)

  const statusText = (status: string) =>
    ({
      Pending: '🕐 Pendiente',
      Completed: '✅ Completado',
      Cancelled: '❌ Cancelado',
      Expired: '⛔ Vencido',
    }[status] ?? status)

  const daysLeftColor = layaway.isExpired
    ? 'text-red-600 bg-red-50 border-red-200'
    : layaway.daysLeft <= 7
      ? 'text-orange-600 bg-orange-50 border-orange-200'
      : layaway.daysLeft <= 15
        ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
        : 'text-green-600 bg-green-50 border-green-200'

  const daysLeftLabel = layaway.isExpired
    ? '❌ Vencido'
    : layaway.daysLeft === 0
      ? '⚠️ Vence hoy'
      : layaway.daysLeft === 1
        ? '⚠️ Vence mañana'
        : `✅ ${layaway.daysLeft} días restantes`

  return (
    <Modal title={`Apartado ${layaway.folio}`} onClose={onClose} size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-1">Cliente</p>
            <p className="font-semibold text-gray-900">{layaway.clientName}</p>
            {layaway.clientPhone && (
              <p className="text-gray-500 text-xs mt-0.5">📞 {layaway.clientPhone}</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-1">Estado</p>
            <p className="font-semibold text-gray-900">{statusText(layaway.status)}</p>
            {layaway.saleFolio && (
              <p className="text-xs text-primary-600 mt-1 font-mono">
                Venta: {layaway.saleFolio}
              </p>
            )}
          </div>

          <div className={`rounded-xl p-3 border ${daysLeftColor}`}>
            <p className="text-xs mb-1 opacity-70">Vigencia</p>
            <p className="font-bold text-sm">{daysLeftLabel}</p>
            <p className="text-xs mt-1 opacity-80">
              Vence:{' '}
              {new Date(layaway.expiresAt).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Productos
          </p>

          <table className="w-full text-sm border rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Producto</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Cant.</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">P. Unit.</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Subtotal</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {layaway.details.map((d, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0 border">
                      {d.imageUrl ? (
                        <img
                          src={d.imageUrl}
                          alt={d.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          📦
                        </div>
                      )}
                    </div>

                    <span className="font-medium text-gray-900">{d.productName}</span>
                  </td>

                  <td className="px-4 py-2.5 text-right text-gray-700">{d.quantity}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">
                    ${d.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                    ${d.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Total</p>
            <p className="text-xl font-black text-gray-900">
              ${layaway.total.toFixed(2)}
            </p>
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-xs text-green-500 mb-1">Pagado</p>
            <p className="text-xl font-black text-green-700">
              ${layaway.deposit.toFixed(2)}
            </p>
          </div>

          <div
            className={`rounded-xl p-4 border ${
              layaway.remaining > 0
                ? 'bg-orange-50 border-orange-100'
                : 'bg-green-50 border-green-100'
            }`}
          >
            <p className={`text-xs mb-1 ${layaway.remaining > 0 ? 'text-orange-500' : 'text-green-500'}`}>
              Restante
            </p>
            <p className={`text-xl font-black ${layaway.remaining > 0 ? 'text-orange-700' : 'text-green-700'}`}>
              ${layaway.remaining.toFixed(2)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Historial de pagos
          </p>

          {!layaway.payments || layaway.payments.length === 0 ? (
            <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-gray-100 text-sm">
              Sin pagos registrados
            </div>
          ) : (
            <div className="space-y-2">
              {layaway.payments.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {layaway.payments.length - idx}
                    </span>

                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {paymentLabel(p.paymentMethod)}
                      </p>

                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.userFullName} ·{' '}
                        {new Date(p.createdAt).toLocaleString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      {p.notes && (
                        <p className="text-xs text-gray-500 mt-0.5 italic">
                          {p.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="font-black text-green-700 text-base">
                    +${p.amount.toFixed(2)}
                  </span>
                </div>
              ))}

              <div className="flex justify-between items-center px-4 py-2 bg-primary-50 rounded-xl border border-primary-100 mt-1">
                <span className="text-sm font-semibold text-primary-700">
                  Total abonado
                </span>
                <span className="font-black text-primary-700">
                  ${layaway.deposit.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
          <p>
            Creado:{' '}
            <span className="text-gray-600 font-medium">
              {new Date(layaway.createdAt).toLocaleString('es-MX')}
            </span>
          </p>

          {layaway.completedAt && (
            <p>
              Completado:{' '}
              <span className="text-gray-600 font-medium">
                {new Date(layaway.completedAt).toLocaleString('es-MX')}
              </span>
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

function AddDepositModal({ layaway, onClose, onSuccess }: {
  layaway: Layaway
  onClose: () => void
  onSuccess: () => void
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ amount: number; paymentMethod: number }>({
    defaultValues: {
      paymentMethod: 1,
    },
  })

  const amount = Number(watch('amount')) || 0
  const paymentMethod = Number(watch('paymentMethod'))

  const mutation = useMutation({
    mutationFn: (d: { amount: number; paymentMethod: number }) =>
      layawaysApi.addDeposit(layaway.id, d.amount, Number(d.paymentMethod)),
    onSuccess: () => {
      toast.success('Abono registrado')
      onSuccess()
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Error'),
  })

  const newRemaining = Math.max(0, layaway.remaining - amount)

  return (
    <Modal title="Agregar abono" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto del abono $
          </label>

          <input
            {...register('amount', {
              valueAsNumber: true,
              required: 'Requerido',
              min: { value: 0.01, message: 'Debe ser mayor a 0' },
              max: {
                value: layaway.remaining,
                message: 'No puede superar el restante',
              },
            })}
            type="number"
            step="0.01"
            inputMode="decimal"
            className="input text-xl font-bold text-center"
            placeholder={layaway.remaining.toFixed(2)}
            autoFocus
          />

          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de abono
          </label>

          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 1, emoji: '💵', name: 'Efectivo' },
              { value: 2, emoji: '💳', name: 'Tarjeta' },
              { value: 4, emoji: '🇺🇸', name: 'Dólares' },
            ].map(({ value, emoji, name }) => (
              <label key={value} className="cursor-pointer">
                <input
                  {...register('paymentMethod')}
                  type="radio"
                  value={value}
                  className="sr-only peer"
                />

                <div className="flex items-center gap-2.5 border-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:border-gray-300 border-gray-200">
                  <span className="text-xl">{emoji}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {name}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {amount > 0 && (
          <div className={`rounded-xl p-3 text-center text-sm font-medium ${
            newRemaining === 0
              ? 'bg-green-50 text-green-700'
              : 'bg-orange-50 text-orange-700'
          }`}>
            {newRemaining === 0
              ? 'El apartado queda completado'
              : `Restará: $${newRemaining.toFixed(2)}`}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>

          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Guardando...' : 'Registrar abono'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function CreateLayawayModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const { items, total, clearCart } = useCartStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{
    clientName: string
    clientPhone: string
    deposit: string
    paymentMethod: number
  }>({
    defaultValues: {
      deposit: '',
      paymentMethod: 1,
    },
  })

  const depositStr = watch('deposit')
  const deposit = parseFloat(depositStr) || 0
  const paymentMethod = Number(watch('paymentMethod'))
  const remaining = Math.max(0, total - deposit)
  const isFullyPaid = deposit >= total && deposit > 0

  const mutation = useMutation({
    mutationFn: (d: {
      clientName: string
      clientPhone: string
      deposit: string
      paymentMethod: number
    }) =>
      layawaysApi.create({
        clientName: d.clientName.trim(),
        clientPhone: d.clientPhone?.trim() || undefined,
        deposit: parseFloat(d.deposit) || 0,
        paymentMethod: Number(d.paymentMethod),
        items: items.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      }),
    onSuccess: res => {
      const data = res.data.data!
      clearCart()

      if (data.status === 'Completed') {
        toast.success(`✅ Apartado liquidado — Venta: ${data.saleFolio}`, {
          duration: 4000,
        })
      } else {
        toast.success(`Apartado ${data.folio} creado`)
      }

      onSuccess()
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? 'Error al crear apartado'),
  })

  if (items.length === 0) {
    return (
      <Modal title="Nuevo apartado" onClose={onClose} size="md">
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <p className="font-medium text-gray-600">
            No hay productos en el carrito
          </p>
          <p className="text-sm mt-1">Agrega productos en el POS primero.</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Nuevo apartado" onClose={onClose} size="xl">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Artículos a apartar
            </p>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 max-h-64 overflow-y-auto border border-gray-100">
              {items.map(i => (
                <div key={i.product.id} className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-white border overflow-hidden shrink-0 shadow-sm">
                    {i.product.imageUrl ? (
                      <img
                        src={i.product.imageUrl}
                        alt={i.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        📦
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {i.product.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {i.quantity} × ${i.product.salePrice.toFixed(2)}
                    </p>
                  </div>

                  <span className="font-bold text-gray-900 shrink-0">
                    ${i.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-gray-900 mt-3 px-1">
              <span>Total del apartado</span>
              <span className="text-primary-600 text-lg">${total.toFixed(2)}</span>
            </div>
          </div>

          <div
            className={`rounded-xl p-4 border space-y-2 text-sm ${
              isFullyPaid
                ? 'bg-green-50 border-green-200'
                : deposit > 0
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-gray-50 border-gray-200'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Resumen de pago
            </p>

            <div className="flex justify-between text-gray-600">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className={`flex justify-between font-medium ${deposit > 0 ? 'text-green-700' : 'text-gray-400'}`}>
              <span>Anticipo</span>
              <span>${deposit.toFixed(2)}</span>
            </div>

            {deposit > 0 && (
              <div className="flex justify-between font-medium text-xs opacity-70">
                <span>Método</span>
                <span>
                  {[
                    { value: 1, label: '💵 Efectivo' },
                    { value: 2, label: '💳 Tarjeta' },
                    { value: 4, label: '🇺🇸 Dólares' },
                    { value: 3, label: '🔄 Otro' },
                  ].find(m => m.value === paymentMethod)?.label}
                </span>
              </div>
            )}

            <div
              className={`flex justify-between font-bold border-t pt-2 ${
                isFullyPaid
                  ? 'border-green-200 text-green-800'
                  : 'border-gray-200 text-gray-900'
              }`}
            >
              <span>{isFullyPaid ? '✅ Sin restante' : 'Restante'}</span>
              <span>${remaining.toFixed(2)}</span>
            </div>

            {isFullyPaid && (
              <p className="text-xs text-green-600 font-medium">
                Se generará una venta automáticamente
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              👤 Nombre del cliente <span className="text-red-500">*</span>
            </label>

            <input
              {...register('clientName', {
                required: 'El nombre es requerido',
              })}
              className="input"
              placeholder="Juan García"
              autoFocus
            />

            {errors.clientName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.clientName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              📞 Teléfono
            </label>

            <input
              {...register('clientPhone')}
              className="input"
              placeholder="614-000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              💰 Anticipo
            </label>

            <input
              {...register('deposit')}
              type="text"
              inputMode="decimal"
              className="input text-lg font-bold"
              placeholder="0.00"
            />

            <p className="text-xs text-gray-400 mt-1">
              Deja en 0 si no hay anticipo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💳 Método de pago del anticipo
            </label>

            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 1, emoji: '💵', name: 'Efectivo' },
                { value: 2, emoji: '💳', name: 'Tarjeta' },
                { value: 4, emoji: '🇺🇸', name: 'Dólares' },
              ].map(({ value, emoji, name }) => (
                <label key={value} className="cursor-pointer">
                  <input
                    {...register('paymentMethod')}
                    type="radio"
                    value={value}
                    className="sr-only peer"
                  />

                  <div
                    className={`flex items-center gap-2.5 border-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:border-gray-300 ${
                      deposit === 0 ? 'border-gray-100 opacity-50' : 'border-gray-200'
                    }`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {name}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {deposit === 0 && (
              <p className="text-xs text-gray-400 mt-1.5">
                El método aplica solo si hay anticipo
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? 'Guardando...' : 'Crear apartado'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}