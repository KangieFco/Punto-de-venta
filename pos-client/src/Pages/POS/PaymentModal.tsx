import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import toast  from 'react-hot-toast'
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
  paymentMethod:  number 
  amountReceived: number
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
  const { items, total, globalDiscount, subtotal, clearCart } = useCartStore()
  //const { print } = usePrinter()

  const [saleComplete, setSaleComplete] = useState<{
    folio: string; change: number; changeDollars?: number
  } | null>(null)

  const { register, control, handleSubmit, formState: { errors } } =
    useForm<PaymentForm>({
      defaultValues: {
        paymentMethod: 1,
        amountReceived: undefined as any,
        exchangeRate: 17,
      }
    })

  const method = useWatch({ control, name: 'paymentMethod' })
  const received = useWatch({ control, name: 'amountReceived' }) || 0
  const exchangeRate = useWatch({ control, name: 'exchangeRate' }) || 1
  const isDollar = Number(method) === 4
  const receivedInPesos = isDollar ? received * exchangeRate : received
  const change = receivedInPesos - total
  const changeDollars = isDollar && change > 0 ? change / exchangeRate : 0

 const mutation = useMutation({
  mutationFn: (data: PaymentForm) => {
    const paymentMethod = Number(data.paymentMethod)
    const amountReceived = Number(data.amountReceived)
    const exchangeRate = Number(data.exchangeRate || 1)

    const amountReceivedInPesos =
      paymentMethod === 4
        ? amountReceived * exchangeRate
        : amountReceived

    const payload = {
      cashRegisterId: Number(cashRegisterId),

      items: items.map(i => ({
        productId: Number(i.product.id),
        quantity: Number(i.quantity),
        discount: Number(i.discount ?? 0),
      })),

      paymentMethod,
      amountReceived: amountReceivedInPesos,
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
        folio:         sale.folio,
        change:        sale.changeAmount,
        changeDollars: isDollar && sale.changeAmount > 0
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

  // Pantalla de recibo
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
          ): (
            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-gray-500 text-sm">Sin cambio</p>
            </div>
          )}
          <button onClick={onClose} className="btn-primary w-full py-3.5 text-base">
            Nueva venta
          </button>
        </div>
      </Modal>
    )
  }

  // Formulario de cobro 
  return (
    <Modal title="Cobrar venta" onClose={onClose} size="md">

      {/* Resumen del carrito */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {items.length} producto(s)
        </p>
        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {items.map(i => (
            <div key={i.product.id}
                 className="flex justify-between text-sm">
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

      <form onSubmit={handleSubmit(d => mutation.mutate(d))}
            className="space-y-4">
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

        {isDollar && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <label className="block text-sm font-medium text-blue-700 mb-1.5">
              Tipo de cambio — 1 USD =
            </label>
            <div className="flex items-center gap-2">
              <input
                {...register('exchangeRate', {
                  valueAsNumber: true,
                  required: true,
                  min: 1
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isDollar ? 'Monto recibido (USD)' : 'Monto recibido ($MXN)'}
          </label>
          <input
            {...register('amountReceived', {
              valueAsNumber: true,
              required: 'Ingresa el monto recibido',
              min: { value: 0.01, message: 'Inválido' }
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
              ≈ ${receivedInPesos.toFixed(2)} MXN
            </p>
          )}
        </div>

        {received > 0 && (
          change >= 0 ? (
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
                Faltan ${Math.abs(change).toFixed(2)} MXN
              </p>
            </div>
          )
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || change < 0 || received <= 0}
            className="btn-primary flex-1 py-3.5 text-base font-bold"
          >
            {mutation.isPending
              ? 'Procesando...'
              : `Cobrar $${total.toFixed(2)}`
            }
          </button>
        </div>
      </form>
    </Modal>
  )
}