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
  onClose:        () => void
}

interface PaymentForm {
  paymentMethod:  number
  amountReceived: number
  cash:           number
  card:           number
  dollars:        number
  exchangeRate:   number
}

const PAYMENT_METHOD = {
  CASH:   1,
  CARD:   2,
  OTHER:  3,
  DOLLAR: 4,
} as const

const METHODS = [
  { value: PAYMENT_METHOD.CASH,   emoji: '💵', name: 'Efectivo' },
  { value: PAYMENT_METHOD.CARD,   emoji: '💳', name: 'Tarjeta'  },
  { value: PAYMENT_METHOD.DOLLAR, emoji: '🇺🇸', name: 'Dólares'  },
  { value: PAYMENT_METHOD.OTHER,  emoji: '🔀', name: 'Mezclar'  },
]

export default function PaymentModal({ cashRegisterId, onClose }: Props) {
  const queryClient = useQueryClient()
  const { items, total, globalDiscount, subtotal, clearCart } = useCartStore()
  const { print, selectedPrinter } = usePrinter()

  const [saleComplete, setSaleComplete] = useState<{
    folio:         string
    change:        number
    changeDollars?: number
  } | null>(null)

  const { register, control, handleSubmit, formState: { errors } } =
    useForm<PaymentForm>({
      defaultValues: {
        paymentMethod:  PAYMENT_METHOD.CASH,
        amountReceived: undefined as unknown as number,
        cash:           undefined as unknown as number,
        card:           undefined as unknown as number,
        dollars:        undefined as unknown as number,
        exchangeRate:   17,
      },
    })

  // ── Watchers ───────────────────────────────────────────────
  const method       = Number(useWatch({ control, name: 'paymentMethod'  }) || PAYMENT_METHOD.CASH)
  const received     = Number(useWatch({ control, name: 'amountReceived' }) || 0)
  const cash         = Number(useWatch({ control, name: 'cash'           }) || 0)
  const card         = Number(useWatch({ control, name: 'card'           }) || 0)
  const dollars      = Number(useWatch({ control, name: 'dollars'        }) || 0)
  const exchangeRate = Number(useWatch({ control, name: 'exchangeRate'   }) || 1)

  const isDollar = method === PAYMENT_METHOD.DOLLAR
  const isMixed  = method === PAYMENT_METHOD.OTHER

  const dollarsInPesos  = dollars * exchangeRate

  const receivedInPesos = isMixed
    ? cash + card + dollarsInPesos
    : isDollar
      ? received * exchangeRate
      : received

  const missing = total - receivedInPesos

  // Cálculo de cambio correcto
  const nonCashPaid = isMixed
    ? card
    : method === PAYMENT_METHOD.CARD ? received : 0

  const cashLikePaid = isMixed
    ? cash + dollarsInPesos
    : isDollar
      ? received * exchangeRate
      : method === PAYMENT_METHOD.CASH ? received : 0

  const cashNeededAfterCard = Math.max(0, total - nonCashPaid)
  const change              = Math.max(0, cashLikePaid - cashNeededAfterCard)
  const changeDollars       = isDollar && change > 0 ? change / exchangeRate : 0

  const hasPayment = isMixed
    ? cash > 0 || card > 0 || dollars > 0
    : received > 0

  // El botón cobrar NO depende de la impresora
  const canSubmit =
    items.length > 0 &&
    hasPayment &&
    missing <= 0 &&
    exchangeRate > 0

  // ── Mutation ───────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (data: PaymentForm) => {
      const paymentMethod = Number(data.paymentMethod)
      const rate          = Number(data.exchangeRate || 1)

      const payments: {
        method:       number
        amount:       number
        exchangeRate: number
      }[] = []

      if (paymentMethod === PAYMENT_METHOD.OTHER) {
        const cashAmt   = Number(data.cash    || 0)
        const cardAmt   = Number(data.card    || 0)
        const dollarAmt = Number(data.dollars || 0)

        if (cashAmt > 0)
          payments.push({ method: PAYMENT_METHOD.CASH,   amount: cashAmt,   exchangeRate: 1    })
        if (cardAmt > 0)
          payments.push({ method: PAYMENT_METHOD.CARD,   amount: cardAmt,   exchangeRate: 1    })
        if (dollarAmt > 0)
          payments.push({ method: PAYMENT_METHOD.DOLLAR, amount: dollarAmt, exchangeRate: rate })
      } else {
        payments.push({
          method:       paymentMethod,
          amount:       Number(data.amountReceived || 0),
          exchangeRate: paymentMethod === PAYMENT_METHOD.DOLLAR ? rate : 1,
        })
      }

      const payload = {
        cashRegisterId: Number(cashRegisterId),
        items: items.map(item => ({
          productId: Number(item.product.id),
          quantity:  Number(item.quantity),
          discount:  Number(item.discount ?? 0),
        })),
        payments,
        discount: Number(globalDiscount ?? 0),
      }

      return salesApi.create(payload)
    },

    onSuccess: async (response) => {
      const sale = response.data.data
      if (!sale) {
        toast.error('Venta registrada sin información')
        return
      }

      // ── Impresión — no bloquea la venta si falla ───────────
      try {
        const ticketRes = await ticketsApi.getBySale(sale.id)
        const ticket    = ticketRes.data.data

        if (ticket) {
          const printRes    = await ticketsApi.print(ticket.id)
          const ticketText  = printRes.data.data?.ticketText

          if (ticketText && selectedPrinter) {
            await print(ticketText)
          } else if (!selectedPrinter) {
            toast('Sin impresora seleccionada — ticket no impreso', {
              icon: '🖨️', duration: 3000,
            })
          }
        }
      } catch (printError) {
        console.warn('Ticket no impreso:', printError)
        toast('Venta guardada. Ticket no impreso.', {
          icon: '⚠️', duration: 3000,
        })
      }

      // ── Limpiar y actualizar siempre ───────────────────────
      clearCart()

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales']         }),
        queryClient.invalidateQueries({ queryKey: ['products']      }),
        queryClient.invalidateQueries({ queryKey: ['cash-register'] }),
      ])

      setSaleComplete({
        folio:         sale.folio,
        change:        Number(sale.changeAmount || 0),
        changeDollars: isDollar && Number(sale.changeAmount) > 0
          ? Number(sale.changeAmount) / exchangeRate
          : undefined,
      })

      toast.success(`Venta ${sale.folio} completada`)
    },

    onError: (error: any) => {
      const data = error.response?.data
      let msg    = data?.message ?? data?.title ?? error.message ?? 'Error al procesar la venta'

      if (data?.errors)
        msg = Object.values(data.errors).flat().join(', ')

      toast.error(msg)
    },
  })

  // ── Pantalla de venta completada ───────────────────────────
  if (saleComplete) {
    return (
      <Modal title="Venta completada" onClose={onClose} size="sm">
        <div className="space-y-5 py-2 text-center">
          <div className="text-6xl">🎉</div>

          <div>
            <p className="text-sm text-gray-400">Folio</p>
            <p className="text-2xl font-black text-gray-900">
              {saleComplete.folio}
            </p>
          </div>

          {saleComplete.change > 0 ? (
            <div className="space-y-1 rounded-2xl border border-green-200
                            bg-green-50 p-5">
              <p className="text-sm font-medium text-green-600">
                Cambio a entregar
              </p>
              <p className="text-4xl font-black text-green-700">
                ${saleComplete.change.toFixed(2)}
                <span className="ml-1 text-base font-normal text-green-500">
                  MXN
                </span>
              </p>
              {saleComplete.changeDollars !== undefined &&
               saleComplete.changeDollars > 0 && (
                <p className="text-sm text-green-500">
                  ≈ ${saleComplete.changeDollars.toFixed(2)} USD
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Sin cambio</p>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="btn-primary w-full py-3.5 text-base"
          >
            Nueva venta
          </button>
        </div>
      </Modal>
    )
  }

  // ── Formulario de cobro ────────────────────────────────────
  return (
    <Modal title="Cobrar venta" onClose={onClose} size="xl">
      <div className="grid items-start gap-6
                      lg:grid-cols-[minmax(280px,0.8fr)_minmax(460px,1.4fr)]">

        {/* ── Panel izquierdo — resumen ──────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide
                          text-gray-400">
              Productos
            </p>
            <span className="rounded-full bg-white px-3 py-1 text-xs
                             font-bold text-gray-600 shadow-sm">
              {items.length} producto(s)
            </span>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto">
            {items.map(item => (
              <div key={item.product.id}
                   className="flex items-start justify-between gap-3
                              rounded-lg bg-white px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 text-gray-700">
                  <span className="font-medium">{item.product.name}</span>
                  <span className="ml-1 text-gray-400">×{item.quantity}</span>
                  {item.discount > 0 && (
                    <span className="ml-1 text-xs text-orange-500">
                      (−${item.discount.toFixed(2)}/u)
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-semibold text-gray-900">
                  ${item.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {globalDiscount > 0 && (
              <div className="flex justify-between text-sm font-medium
                              text-orange-600">
                <span>Descuento</span>
                <span>−${globalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-xl
                            bg-white px-4 py-3 mt-2">
              <span className="text-base font-black text-gray-900">
                TOTAL
              </span>
              <span className="text-2xl font-black text-primary-600">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Panel derecho — formulario ─────────────────────── */}
        <form
          onSubmit={handleSubmit(data => mutation.mutate(data))}
          className="space-y-4"
        >

          {/* Método de pago */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Método de pago
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {METHODS.map(({ value, emoji, name }) => (
                <label key={value} className="cursor-pointer">
                  <input
                    {...register('paymentMethod', { valueAsNumber: true })}
                    type="radio"
                    value={value}
                    className="peer sr-only"
                  />
                  <div className="flex min-h-20 select-none flex-col
                                  items-center justify-center gap-1
                                  rounded-xl border-2 border-gray-200
                                  px-2 py-3 transition-all
                                  hover:border-gray-300
                                  peer-checked:border-primary-500
                                  peer-checked:bg-primary-50">
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-xs font-semibold text-gray-600">
                      {name}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Tipo de cambio — solo dólares simples */}
          {!isMixed && isDollar && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <label className="mb-2 block text-sm font-medium text-blue-700">
                Tipo de cambio — 1 USD =
              </label>
              <div className="flex items-center gap-3">
                <input
                  {...register('exchangeRate', {
                    valueAsNumber: true,
                    required: 'Requerido',
                    min: { value: 1, message: 'Inválido' },
                  })}
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className="input w-32 text-center font-bold"
                  placeholder="17.00"
                />
                <span className="font-medium text-blue-600">MXN</span>
                <span className="ml-auto text-sm text-blue-500">
                  Cobrar: ${(total / exchangeRate).toFixed(2)} USD
                </span>
              </div>
            </div>
          )}

          {/* Monto recibido — pago simple */}
          {!isMixed && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {isDollar ? 'Monto recibido (USD)' : 'Monto recibido ($MXN)'}
              </label>
              <input
                {...register('amountReceived', {
                  valueAsNumber: true,
                  required: 'Ingresa el monto recibido',
                  min: { value: 0.01, message: 'Monto inválido' },
                })}
                type="number"
                step="0.01"
                inputMode="decimal"
                className="input py-3 text-center text-2xl font-black"
                placeholder={
                  isDollar
                    ? (total / exchangeRate).toFixed(2)
                    : total.toFixed(2)
                }
                autoFocus
              />
              {errors.amountReceived && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.amountReceived.message}
                </p>
              )}
              {isDollar && received > 0 && (
                <p className="mt-1 text-center text-xs text-blue-500">
                  ≈ ${(received * exchangeRate).toFixed(2)} MXN
                </p>
              )}
            </div>
          )}

          {/* Pago mixto */}
          {isMixed && (
            <div className="space-y-3">
              {/* Banner info */}
              <div className="flex items-center justify-between
                              rounded-xl border border-orange-200
                              bg-orange-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-orange-700">
                    Mezclar pagos
                  </p>
                  <p className="text-xs text-orange-600 mt-0.5">
                    Ingresa solo los métodos que usará el cliente
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-orange-600">Total ingresado</p>
                  <p className="text-lg font-black text-orange-700">
                    ${receivedInPesos.toFixed(2)} MXN
                  </p>
                </div>
              </div>

              {/* Tres campos de pago */}
              <div className="grid gap-3 md:grid-cols-3">

                {/* Efectivo */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <label className="mb-1 block text-sm font-semibold
                                    text-gray-700">
                    💵 Efectivo
                  </label>
                  <p className="mb-2 text-xs text-gray-400">Pesos mexicanos</p>
                  <input
                    {...register('cash', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'Inválido' },
                    })}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    className="input py-3 text-center text-xl font-bold"
                    placeholder="0.00"
                    autoFocus
                  />
                  <p className="mt-1 text-center text-xs text-gray-400">MXN</p>
                </div>

                {/* Tarjeta */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <label className="mb-1 block text-sm font-semibold
                                    text-gray-700">
                    💳 Tarjeta
                  </label>
                  <p className="mb-2 text-xs text-gray-400">Monto con tarjeta</p>
                  <input
                    {...register('card', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'Inválido' },
                    })}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    className="input py-3 text-center text-xl font-bold"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-center text-xs text-gray-400">MXN</p>
                </div>

                {/* Dólares */}
                <div className="rounded-xl border border-blue-200
                                bg-blue-50 p-4">
                  <label className="mb-1 block text-sm font-semibold
                                    text-blue-700">
                    🇺🇸 Dólares
                  </label>
                  <p className="mb-2 text-xs text-blue-500">Cantidad en USD</p>
                  <input
                    {...register('dollars', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'Inválido' },
                    })}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    className="input py-3 text-center text-xl font-bold"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-center text-xs text-blue-500">
                    {dollars > 0
                      ? `≈ $${dollarsInPesos.toFixed(2)} MXN`
                      : 'USD'}
                  </p>
                </div>
              </div>

              {/* Tipo de cambio en modo mixto */}
              <div className="rounded-xl border border-blue-200
                              bg-blue-50 px-4 py-3
                              flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-blue-700
                                    whitespace-nowrap">
                    1 USD =
                  </label>
                  <input
                    {...register('exchangeRate', {
                      valueAsNumber: true,
                      min: { value: 1, message: 'Inválido' },
                    })}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    className="input w-24 text-center font-bold text-sm"
                    placeholder="17.00"
                  />
                  <span className="text-sm font-medium text-blue-600">MXN</span>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-blue-500">Venta en dólares</p>
                  <p className="text-sm font-black text-blue-700">
                    ${(total / exchangeRate).toFixed(2)} USD
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Panel cambio / faltante */}
          {hasPayment && (
            missing <= 0 ? (
              <div className="flex items-center justify-between
                              rounded-xl border border-green-200
                              bg-green-50 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    Cambio a entregar
                  </p>
                  {isDollar && changeDollars > 0 && (
                    <p className="text-xs text-green-500 mt-0.5">
                      ≈ ${changeDollars.toFixed(2)} USD
                    </p>
                  )}
                </div>
                <p className="text-3xl font-black text-green-700">
                  ${change.toFixed(2)} MXN
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between
                              rounded-xl border border-red-200
                              bg-red-50 px-5 py-3">
                <p className="text-sm font-semibold text-red-600">
                  Pago incompleto
                </p>
                <p className="text-xl font-black text-red-700">
                  Faltan ${Math.abs(missing).toFixed(2)} MXN
                </p>
              </div>
            )
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !canSubmit}
              className="btn-primary flex-1 py-3.5 text-base font-bold"
            >
              {mutation.isPending
                ? 'Procesando...'
                : `Cobrar $${total.toFixed(2)}`
              }
            </button>
          </div>

        </form>
      </div>
    </Modal>
  )
}