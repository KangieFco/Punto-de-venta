import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import { salesApi } from '../../api/sales'
//import { ticketsApi } from '../../api/tickets'
import { useCartStore } from '../../store/cartStore'
//import { usePrinter } from '../../hooks/usePrinter'

interface Props {
  cashRegisterId: number
  onClose: () => void
}

interface PaymentForm {
  paymentMethod: number
  amountReceived: number
  cash: number
  card: number
  dollars: number
  exchangeRate: number
}

const PAYMENT_METHOD = {
  CASH: 1,
  CARD: 2,
  OTHER: 3,
  DOLLAR: 4,
}

const METHODS = [
  { value: 1, label: '💵', name: 'Efectivo' },
  { value: 2, label: '💳', name: 'Tarjeta' },
  { value: 4, label: '🇺🇸', name: 'Dólares' },
  { value: 3, label: '🔄', name: 'Mezclar' },
]

export default function PaymentModal({ cashRegisterId, onClose }: Props) {
  const qc = useQueryClient()
  const { items, total, globalDiscount, subtotal, clearCart } = useCartStore()
  //const { print } = usePrinter()

  const [saleComplete, setSaleComplete] = useState<{
    folio: string
    change: number
    changeDollars?: number
  } | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentForm>({
    defaultValues: {
      paymentMethod: 1,
      amountReceived: undefined as any,
      cash: undefined as any,
      card: undefined as any,
      dollars: undefined as any,
      exchangeRate: 17,
    },
  })

  const method = Number(useWatch({ control, name: 'paymentMethod' }) || 1)
  const received = Number(useWatch({ control, name: 'amountReceived' }) || 0)
  const cash = Number(useWatch({ control, name: 'cash' }) || 0)
  const card = Number(useWatch({ control, name: 'card' }) || 0)
  const dollars = Number(useWatch({ control, name: 'dollars' }) || 0)
  const exchangeRate = Number(useWatch({ control, name: 'exchangeRate' }) || 1)

  const isDollar = method === PAYMENT_METHOD.DOLLAR
  const isMixed = method === PAYMENT_METHOD.OTHER

  const dollarsInPesos = dollars * exchangeRate

  const receivedInPesos = isMixed
    ? cash + card + dollarsInPesos
    : isDollar
      ? received * exchangeRate
      : received

  const missing = total - receivedInPesos

  const nonCashPaid = isMixed ? card : method === PAYMENT_METHOD.CARD ? received : 0
  const cashLikePaid = isMixed
    ? cash + dollarsInPesos
    : isDollar
      ? received * exchangeRate
      : method === PAYMENT_METHOD.CASH
        ? received
        : 0

  const cashNeededAfterCard = Math.max(0, total - nonCashPaid)
  const change = Math.max(0, cashLikePaid - cashNeededAfterCard)

  const changeDollars = isDollar && change > 0 ? change / exchangeRate : 0

  const hasPayment = isMixed
    ? cash > 0 || card > 0 || dollars > 0
    : received > 0

  const canSubmit = hasPayment && missing <= 0

  const mutation = useMutation({
    mutationFn: (data: PaymentForm) => {
      const paymentMethod = Number(data.paymentMethod)
      const amountReceived = Number(data.amountReceived || 0)
      const cashAmount = Number(data.cash || 0)
      const cardAmount = Number(data.card || 0)
      const dollarAmount = Number(data.dollars || 0)
      const rate = Number(data.exchangeRate || 1)

      const payments: {
        method: number
        amount: number
        exchangeRate: number
      }[] = []

      if (paymentMethod === PAYMENT_METHOD.OTHER) {
        if (cashAmount > 0) {
          payments.push({
            method: PAYMENT_METHOD.CASH,
            amount: cashAmount,
            exchangeRate: 1,
          })
        }

        if (cardAmount > 0) {
          payments.push({
            method: PAYMENT_METHOD.CARD,
            amount: cardAmount,
            exchangeRate: 1,
          })
        }

        if (dollarAmount > 0) {
          payments.push({
            method: PAYMENT_METHOD.DOLLAR,
            amount: dollarAmount,
            exchangeRate: rate,
          })
        }
      } else {
        payments.push({
          method: paymentMethod,
          amount: amountReceived,
          exchangeRate:
            paymentMethod === PAYMENT_METHOD.DOLLAR ? rate : 1,
        })
      }

      const payload = {
        cashRegisterId: Number(cashRegisterId),

        items: items.map(i => ({
          productId: Number(i.product.id),
          quantity: Number(i.quantity),
          discount: Number(i.discount ?? 0),
        })),

        payments,
        discount: Number(globalDiscount ?? 0),
      }

      console.log('PAYLOAD VENTA:', payload)

      return salesApi.create(payload)
    },

    onSuccess: async (res) => {
      const sale = res.data.data!
      //try {
      //  const tRes    = await ticketsApi.getBySale(sale.id)
      //  const ticket  = tRes.data.data!
       // const printed = await ticketsApi.print(ticket.id)
       // const text    = printed.data.data?.ticketText
        //if (text) await print(text).catch(() => {})
      //} catch { /* ticket no bloquea la venta */ }

      clearCart()
      qc.invalidateQueries({ queryKey: ['sales'] })
      setSaleComplete({
        folio: sale.folio,
        change: sale.changeAmount,
        changeDollars:
          isDollar && sale.changeAmount > 0
            ? sale.changeAmount / exchangeRate
            : undefined,
      })
      toast.success(`Venta ${sale.folio} completada`)
    },

    onError: (e: any) => {
      console.error('ERROR COMPLETO:', e)
      console.error('RESPUESTA BACKEND:', e.response?.data)
      console.error('STATUS:', e.response?.status)
      console.error('PAYLOAD ENVIADO:', e.config?.data)

      const data = e.response?.data

      let msg =
        data?.message ||
        data?.title ||
        e.message ||
        'Error al procesar venta'

      if (data?.errors) {
        msg = Object.values(data.errors).flat().join(', ')
      }

      toast.error(msg)
    },
  })

  if (saleComplete) {
    return (
      <Modal title="Venta completada" onClose={onClose} size="sm">
        <div className="text-center space-y-5 py-2">
          <div>
            <img
              src="/mineros.png"
              alt="Logo"
              className="w-32 h-32 object-contain mb-2 mx-auto block"
            />
          </div>

          <div>
            <p className="text-gray-400 text-sm">Folio</p>
            <p className="text-2xl font-black text-gray-900">
              {saleComplete.folio}
            </p>
          </div>

          {saleComplete.change > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-2">
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
          ) : (
            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-gray-500 text-sm">Sin cambio</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="btn-primary w-full py-3.5 text-base"
          >
            Nueva venta
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Cobrar venta" onClose={onClose} size="md">
      <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {items.length} producto(s)
        </p>

        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {items.map(i => (
            <div key={i.product.id} className="flex justify-between text-sm">
              <span className="text-gray-700 truncate flex-1 mr-2">
                {i.product.name}
                <span className="text-gray-400 ml-1">×{i.quantity}</span>
                {i.discount > 0 && (
                  <span className="text-orange-500 ml-1">
                    (−${i.discount.toFixed(2)}/u)
                  </span>
                )}
              </span>

              <span className="font-medium text-gray-900 shrink-0">
                ${i.subtotal.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 mt-3 pt-3 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {globalDiscount > 0 && (
            <div className="flex justify-between text-sm text-orange-600 font-medium">
              <span>Descuento</span>
              <span>−${globalDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-gray-900 text-base">
            <span>TOTAL</span>
            <span className="text-primary-600">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(d => mutation.mutate(d))}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de pago
          </label>

          <div className="grid grid-cols-4 gap-2">
            {METHODS.map(({ value, name }) => (
              <label key={value} className="cursor-pointer">
                <input
                  {...register('paymentMethod', { valueAsNumber: true })}
                  type="radio"
                  value={value}
                  className="sr-only peer"
                />

                <div className="flex flex-col items-center gap-1 border-2 border-gray-200 rounded-xl py-3 peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:border-gray-300 transition-all cursor-pointer select-none">
                  <span className="text-xs font-semibold text-gray-600">
                    {name}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {!isMixed && isDollar && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <label className="block text-sm font-medium text-blue-700 mb-1.5">
              Tipo de cambio — 1 USD =
            </label>

            <div className="flex items-center gap-2">
              <input
                {...register('exchangeRate', {
                  valueAsNumber: true,
                  required: true,
                  min: 1,
                })}
                type="text"
                inputMode="decimal"
                className="input w-28 text-center font-bold text-base"
              />

              <span className="text-blue-600 font-medium">MXN</span>

              <span className="text-blue-400 text-sm ml-auto">
                Cobrar: ${(total / exchangeRate).toFixed(2)} USD
              </span>
            </div>
          </div>
        )}

        {!isMixed && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isDollar ? 'Monto recibido (USD)' : 'Monto recibido ($MXN)'}
            </label>

            <input
              {...register('amountReceived', {
                valueAsNumber: true,
                required: 'Ingresa el monto recibido',
                min: { value: 0.01, message: 'Inválido' },
              })}
              type="text"
              inputMode="decimal"
              className="input text-2xl font-black py-3 text-center"
              placeholder={
                isDollar
                  ? (total / exchangeRate).toFixed(2)
                  : total.toFixed(2)
              }
              autoFocus
            />

            {errors.amountReceived && (
              <p className="text-red-500 text-xs mt-1">
                {errors.amountReceived.message}
              </p>
            )}

            {isDollar && received > 0 && (
              <p className="text-xs text-blue-500 mt-1 text-center">
                ≈ ${(received * exchangeRate).toFixed(2)} MXN
              </p>
            )}
          </div>
        )}

        {isMixed && (
          <div className="space-y-3">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-sm font-semibold text-orange-700">
                Mezclar pagos
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Ingresa solo los métodos que usará el cliente.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                💵 Efectivo ($MXN)
              </label>
              <input
                {...register('cash', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Inválido' },
                })}
                type="text"
                inputMode="decimal"
                className="input text-xl font-bold py-3 text-center"
                placeholder="0.00"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                💳 Tarjeta ($MXN)
              </label>
              <input
                {...register('card', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Inválido' },
                })}
                type="text"
                inputMode="decimal"
                className="input text-xl font-bold py-3 text-center"
                placeholder="0.00"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  🇺🇸 Dólares recibidos
                </label>
                <input
                  {...register('dollars', {
                    valueAsNumber: true,
                    min: { value: 0, message: 'Inválido' },
                  })}
                  type="text"
                  inputMode="decimal"
                  className="input text-xl font-bold py-3 text-center"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Tipo de cambio — 1 USD =
                </label>

                <div className="flex items-center gap-2">
                  <input
                    {...register('exchangeRate', {
                      valueAsNumber: true,
                      min: { value: 1, message: 'Inválido' },
                    })}
                    type="text"
                    inputMode="decimal"
                    className="input w-28 text-center font-bold text-base"
                  />

                  <span className="text-blue-600 font-medium">MXN</span>

                  <span className="text-blue-400 text-sm ml-auto">
                    Total: ${(total / exchangeRate).toFixed(2)} USD
                  </span>
                </div>

                {dollars > 0 && (
                  <p className="text-xs text-blue-500 mt-1 text-center">
                    ${dollars.toFixed(2)} USD ≈ ${dollarsInPesos.toFixed(2)} MXN
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {(errors.cash || errors.card || errors.dollars || errors.exchangeRate) && (
          <p className="text-red-500 text-xs">
            Verifica los montos ingresados.
          </p>
        )}

        {hasPayment && (
          missing <= 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-sm text-green-600 font-medium">
                Cambio a entregar
              </p>

              <p className="text-3xl font-black text-green-700 mt-1">
                ${change.toFixed(2)} MXN
              </p>

              {isDollar && changeDollars > 0 && (
                <p className="text-sm text-green-500 mt-0.5">
                  ≈ ${changeDollars.toFixed(2)} USD
                </p>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-sm text-red-600 font-semibold">
                Faltan ${Math.abs(missing).toFixed(2)} MXN
              </p>
            </div>
          )
        )}

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
            disabled={mutation.isPending || !canSubmit}
            className="btn-primary flex-1 py-3.5 text-base font-bold"
          >
            {mutation.isPending
              ? 'Procesando...'
              : `Cobrar $${total.toFixed(2)}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}