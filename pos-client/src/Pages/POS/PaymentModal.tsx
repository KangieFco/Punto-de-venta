import { useState }                         from 'react'
import { useMutation, useQueryClient }      from '@tanstack/react-query'
import { useForm, useWatch }                from 'react-hook-form'
import toast                                from 'react-hot-toast'
import Modal                                from '../../components/ui/Modal'
import { salesApi }                         from '../../api/sales'
import { ticketsApi }                       from '../../api/tickets'
import { useCartStore }                     from '../../store/cartStore'
import { usePrinter }                       from '../../hooks/usePrinter'

interface Props {
  cashRegisterId: number
  onClose: () => void
}

interface PaymentForm {
  paymentMethod:  number   // 1=Cash 2=Card 3=Other 4=Dollar
  amountReceived: number
  discount:       number
  exchangeRate:   number
}

const METHODS = [
  { value: 1, label: '💵',  name: 'Efectivo' },
  { value: 2, label: '💳',  name: 'Tarjeta'  },
  { value: 4, label: '🇺🇸',  name: 'Dólares'  },
  { value: 3, label: '🔄',  name: 'Otro'     },
]

export default function PaymentModal({ cashRegisterId, onClose }: Props) {
  const qc = useQueryClient()
  const { items, total, clearCart } = useCartStore()
  const { print } = usePrinter()

  const [saleComplete, setSaleComplete] = useState<{
    folio: string; change: number; changeDollars?: number
  } | null>(null)

  const { register, control, handleSubmit, formState: { errors } } =
    useForm<PaymentForm>({
      defaultValues: {
        paymentMethod: 1, amountReceived: 0,
        discount: 0, exchangeRate: 17
      }
    })

  const method       = useWatch({ control, name: 'paymentMethod' })
  const received     = useWatch({ control, name: 'amountReceived' }) || 0
  const discount     = useWatch({ control, name: 'discount' })       || 0
  const exchangeRate = useWatch({ control, name: 'exchangeRate' })   || 1

  const isDollar     = Number(method) === 4
  const finalTotal   = total - discount
  const receivedInPesos = isDollar ? received * exchangeRate : received
  const change          = receivedInPesos - finalTotal
  const changeDollars   = isDollar && change > 0
    ? change / exchangeRate : 0

  const mutation = useMutation({
    mutationFn: (data: PaymentForm) =>
      salesApi.create({
        cashRegisterId,

        items: items.map(i => ({
          productId: i.product.id,
          quantity:  i.quantity,
          discount:  i.discount,
        })),

        paymentMethod:  Number(data.paymentMethod),
        amountReceived: Number(data.amountReceived),
        discount:       Number(data.discount),
        exchangeRate:   Number(data.exchangeRate),
      }),

    onSuccess: async (res) => {
      const sale = res.data.data!
      try {
        const tRes   = await ticketsApi.getBySale(sale.id)
        const ticket = tRes.data.data!
        const printed = await ticketsApi.print(ticket.id)
        const text    = printed.data.data?.ticketText
        if (text) await print(text).catch(() => {})
      } catch { /* no bloquear si falla el ticket */ }

      clearCart()
      qc.invalidateQueries({ queryKey: ['sales'] })

      setSaleComplete({
        folio:        sale.folio,
        change:       sale.changeAmount,
        changeDollars: isDollar && sale.changeAmount > 0
          ? sale.changeAmount / exchangeRate : undefined,
      })
      toast.success(`Venta ${sale.folio} completada`)
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? 'Error al procesar venta'),
  })

  // ── Pantalla de éxito ─────────────────────────────────────────
  if (saleComplete) {
    return (
      <Modal title="✅ Venta completada" onClose={onClose} size="sm">
        <div className="text-center space-y-4">
          <div className="text-5xl">🎉</div>
          <div>
            <p className="text-gray-400 text-sm">Folio</p>
            <p className="text-2xl font-black text-gray-900">
              {saleComplete.folio}
            </p>
          </div>

          {saleComplete.change > 0 && (
            <div className="bg-green-50 border border-green-200
                            rounded-2xl p-5 space-y-2">
              <p className="text-green-600 text-sm font-medium">
                Cambio a entregar
              </p>
              <p className="text-4xl font-black text-green-700">
                ${saleComplete.change.toFixed(2)}
                <span className="text-base font-normal text-green-500 ml-1">
                  MXN
                </span>
              </p>
              {saleComplete.changeDollars !== undefined &&
               saleComplete.changeDollars > 0 && (
                <p className="text-green-500 text-sm">
                  ≈ ${saleComplete.changeDollars.toFixed(2)} USD
                </p>
              )}
            </div>
          )}

          <button onClick={onClose} className="btn-primary w-full py-3">
            Nueva venta
          </button>
        </div>
      </Modal>
    )
  }

  // ── Formulario de cobro ───────────────────────────────────────
  return (
    <Modal title="Cobrar venta" onClose={onClose} size="md">

      {/* Resumen compacto */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 space-y-1.5">
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
          {items.length} producto(s)
        </p>
        {items.map(i => (
          <div key={i.product.id}
               className="flex items-center gap-2 text-sm">
            {/* Miniatura */}
            <div className="w-7 h-7 rounded-md overflow-hidden bg-gray-200
                            shrink-0">
              {i.product.imageUrl
                ? <img src={i.product.imageUrl} alt={i.product.name}
                       className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gray-200" />
              }
            </div>
            <span className="flex-1 truncate text-gray-700">
              {i.product.name}
              <span className="text-gray-400 ml-1">×{i.quantity}</span>
            </span>
            <span className="font-medium text-gray-900 shrink-0">
              ${i.subtotal.toFixed(2)}
            </span>
          </div>
        ))}
        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between
                        font-bold text-gray-900">
          <span>TOTAL</span>
          <span className="text-primary-600">${finalTotal.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))}
            className="space-y-4">

        {/* Método de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de pago
          </label>
          <div className="grid grid-cols-4 gap-2">
            {METHODS.map(({ value, label, name }) => (
              <label key={value} className="cursor-pointer">
                <input
                  {...register('paymentMethod', { valueAsNumber: true })}
                  type="radio"
                  value={value}
                  className="sr-only peer"
                />
                <div className="flex flex-col items-center gap-1
                                border-2 border-gray-200 rounded-xl py-2.5
                                peer-checked:border-primary-500
                                peer-checked:bg-primary-50
                                hover:border-gray-300 transition-all cursor-pointer">
                  <span className="text-xl">{label}</span>
                  <span className="text-xs font-medium text-gray-600
                                   peer-checked:text-primary-700">
                    {name}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Tipo de cambio — solo si es dólares */}
        {isDollar && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Tipo de cambio (1 USD = ? MXN)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-blue-500 text-sm">$1 USD =</span>
              <input
                {...register('exchangeRate', {
                  valueAsNumber: true,
                  required: 'Requerido',
                  min: { value: 1, message: 'Inválido' }
                })}
                type="number"
                step="0.01"
                className="input w-28 text-center font-bold"
                placeholder="17.00"
              />
              <span className="text-blue-500 text-sm">MXN</span>
            </div>
            {errors.exchangeRate && (
              <p className="text-red-500 text-xs mt-1">
                {errors.exchangeRate.message}
              </p>
            )}
          </div>
        )}

        {/* Descuento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descuento ($MXN)
          </label>
          <input
            {...register('discount', { valueAsNumber: true, min: 0 })}
            type="number" step="0.01"
            className="input" placeholder="0.00"
          />
        </div>

        {/* Monto recibido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isDollar ? 'Monto recibido (USD $)' : 'Monto recibido ($)'}
          </label>
          <input
            {...register('amountReceived', {
              valueAsNumber: true,
              required: 'Requerido',
              min: { value: 0.01, message: 'Inválido' }
            })}
            type="number" step="0.01"
            className="input text-xl font-bold py-3"
            placeholder={isDollar
              ? (finalTotal / exchangeRate).toFixed(2)
              : finalTotal.toFixed(2)
            }
            autoFocus
          />
          {errors.amountReceived && (
            <p className="text-red-500 text-xs mt-1">
              {errors.amountReceived.message}
            </p>
          )}
          {/* Equivalencia en pesos si es dólares */}
          {isDollar && received > 0 && (
            <p className="text-xs text-blue-500 mt-1">
              ≈ ${receivedInPesos.toFixed(2)} MXN
            </p>
          )}
        </div>

        {/* Cambio */}
        {change > 0 && (
          <div className="bg-green-50 border border-green-200
                          rounded-xl p-4 space-y-1">
            <p className="text-sm text-green-600 font-medium">
              Cambio a entregar
            </p>
            <p className="text-2xl font-black text-green-700">
              ${change.toFixed(2)} MXN
            </p>
            {isDollar && changeDollars > 0 && (
              <p className="text-sm text-green-500">
                ≈ ${changeDollars.toFixed(2)} USD
              </p>
            )}
          </div>
        )}

        {change < 0 && received > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600">
              Faltan ${Math.abs(change).toFixed(2)} MXN
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || change < 0}
            className="btn-primary flex-1 py-3 text-base font-bold"
          >
            {mutation.isPending
              ? 'Procesando...'
              : `Cobrar $${finalTotal.toFixed(2)}`
            }
          </button>
        </div>
      </form>
    </Modal>
  )
}