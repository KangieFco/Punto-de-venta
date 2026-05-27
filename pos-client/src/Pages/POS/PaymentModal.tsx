import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import Modal from '../../components/ui/Modal'
import { salesApi } from '../../api/sales'
import { ticketsApi } from '../../api/tickets'
import { useCartStore } from '../../store/cartStore'
import { usePrinter } from '../../hooks/usePrinter'

interface Props {
  cashRegisterId: number
  onClose: () => void
}

interface PaymentForm {
  paymentMethod: number
  amountReceived: number
  discount: number
}

export default function PaymentModal({ cashRegisterId, onClose }: Props) {
  const qc = useQueryClient()
  const { items, total, clearCart } = useCartStore()
  const { print } = usePrinter()

  const [saleComplete, setSaleComplete] = useState<{
    folio: string
    change: number
    ticketId: number
  } | null>(null)

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentForm>({
    defaultValues: {
      paymentMethod: 1,
      amountReceived: 0,
      discount: 0,
    },
  })

  const amountReceived = Number(watch('amountReceived')) || 0
  const discount = Number(watch('discount')) || 0
  const finalTotal = Math.max(total - discount, 0)
  const change = amountReceived - finalTotal

  const mutation = useMutation({
    mutationFn: (data: PaymentForm) =>
      salesApi.create({
        cashRegisterId,
        items: items.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
          discount: i.discount ?? 0,
        })),
        paymentMethod: data.paymentMethod,
        amountReceived: data.amountReceived,
        discount: data.discount ?? 0,
      }),

    onSuccess: async res => {
      const sale = res.data.data

      if (!sale) {
        toast.error('La venta se registró, pero no se recibió respuesta válida')
        return
      }

      try {
        const tRes = await ticketsApi.getBySale(sale.id)
        const ticket = tRes.data.data

        if (ticket) {
          const printed = await ticketsApi.print(ticket.id)
          const text = printed.data.data?.ticketText

          if (text) {
            await print(text).catch(() => {
              toast.error('Venta completada, pero no se pudo imprimir el ticket')
            })
          }

          setSaleComplete({
            folio: sale.folio,
            change: sale.changeAmount,
            ticketId: ticket.id,
          })
        } else {
          setSaleComplete({
            folio: sale.folio,
            change: sale.changeAmount,
            ticketId: 0,
          })
        }
      } catch {
        setSaleComplete({
          folio: sale.folio,
          change: sale.changeAmount,
          ticketId: 0,
        })
      }

      clearCart()
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['products'] })

      toast.success(`Venta ${sale.folio} completada`)
    },

    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Error al procesar venta')
    },
  })

  const onSubmit = (data: PaymentForm) => {
    if (items.length === 0) {
      toast.error('No hay productos en el carrito')
      return
    }

    if (discount > total) {
      toast.error('El descuento no puede ser mayor al total')
      return
    }

    mutation.mutate(data)
  }

  if (saleComplete) {
    return (
      <Modal title="✅ Venta completada" onClose={onClose} size="sm">
        <div className="text-center space-y-4">
          <div className="text-5xl">🎉</div>

          <div>
            <p className="text-gray-500 text-sm">Folio</p>
            <p className="text-xl font-bold text-gray-900">
              {saleComplete.folio}
            </p>
          </div>

          {saleComplete.change > 0 && (
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-green-600 text-sm">Cambio a entregar</p>
              <p className="text-3xl font-bold text-green-700">
                ${saleComplete.change.toFixed(2)}
              </p>
            </div>
          )}

          <button onClick={onClose} className="btn-primary w-full">
            Nueva venta
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Cobrar venta" onClose={onClose} size="md">
      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
        <h3 className="font-medium text-gray-700 text-sm mb-3">
          Resumen ({items.length} productos)
        </h3>

        {items.map(i => (
          <div
            key={i.product.id}
            className="flex justify-between text-sm text-gray-600"
          >
            <span>
              {i.product.name} x{i.quantity}
            </span>
            <span>${i.subtotal.toFixed(2)}</span>
          </div>
        ))}

        <div className="border-t pt-2 mt-2 flex justify-between font-bold text-gray-900">
          <span>TOTAL</span>
          <span>${finalTotal.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de pago
          </label>

          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 1, label: '💵 Efectivo' },
              { value: 2, label: '💳 Tarjeta' },
              { value: 3, label: '🔄 Otro' },
            ].map(({ value, label }) => (
              <label key={value} className="relative cursor-pointer">
                <input
                  {...register('paymentMethod', { valueAsNumber: true })}
                  type="radio"
                  value={value}
                  className="sr-only peer"
                />

                <div className="text-center border-2 border-gray-200 rounded-xl py-3 text-sm font-medium peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:text-primary-700 hover:border-gray-300 transition-colors">
                  {label}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descuento ($)
          </label>

          <input
            {...register('discount', {
              valueAsNumber: true,
              min: {
                value: 0,
                message: 'El descuento no puede ser negativo',
              },
              max: {
                value: total,
                message: 'El descuento no puede ser mayor al total',
              },
            })}
            type="number"
            step="0.01"
            className="input"
            placeholder="0.00"
          />

          {errors.discount && (
            <p className="text-red-500 text-xs mt-1">
              {errors.discount.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto recibido ($)
          </label>

          <input
            {...register('amountReceived', {
              valueAsNumber: true,
              required: 'Requerido',
              min: {
                value: finalTotal,
                message: 'Monto insuficiente',
              },
            })}
            type="number"
            step="0.01"
            className="input text-lg font-bold"
            placeholder={finalTotal.toFixed(2)}
            autoFocus
          />

          {errors.amountReceived && (
            <p className="text-red-500 text-xs mt-1">
              {errors.amountReceived.message}
            </p>
          )}
        </div>

        {change > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-600">Cambio</p>
            <p className="text-2xl font-bold text-green-700">
              ${change.toFixed(2)}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={mutation.isPending || change < 0 || items.length === 0}
            className="btn-primary flex-1 text-base py-3"
          >
            {mutation.isPending
              ? 'Procesando...'
              : `Cobrar $${finalTotal.toFixed(2)}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}