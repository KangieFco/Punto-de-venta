import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { layawaysApi } from '../../../api/layaways'
import Modal from '../../../components/ui/Modal'
import { useCartStore } from '../../../store/cartStore'

type Props = {
  onClose: () => void
  onSuccess: () => void
}

type FormValues = {
  clientName: string
  clientPhone: string
  deposit: string
  paymentMethod: number
}

export default function CreateLayawayModal({ onClose, onSuccess }: Props) {
  const { items, total, clearCart } = useCartStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
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
    mutationFn: (d: FormValues) =>
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
          <p className="text-sm mt-1">Agrega productos en el carrito primero.</p>
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

            <div
              className={`flex justify-between font-medium ${
                deposit > 0 ? 'text-green-700' : 'text-gray-400'
              }`}
            >
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