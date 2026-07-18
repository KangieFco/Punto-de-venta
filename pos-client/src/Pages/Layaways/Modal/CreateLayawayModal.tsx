import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { layawaysApi } from '../../../api/layaways'
import Modal from '../../../components/ui/Modal'
import { useCartStore } from '../../../store/cartStore'
import { usePrinter } from '../../../hooks/usePrinter'

import {
  buildLayawayTicketText,
} from '../../../features/Layaways/utils/layawayTicket'

type Props = {
  onClose: () => void
  onSuccess: () => void
}

type CreateLayawayForm = {
  clientName: string
  clientPhone: string
  deposit: string
  paymentMethod: number
}

const paymentMethods = [
  {
    value: 1,
    emoji: '💵',
    name: 'Efectivo',
    label: 'Efectivo',
  },
  {
    value: 2,
    emoji: '💳',
    name: 'Tarjeta',
    label: 'Tarjeta',
  },
  {
    value: 4,
    emoji: '🇺🇸',
    name: 'Dólares',
    label: 'Dólares',
  },
]

export default function CreateLayawayModal({
  onClose,
  onSuccess,
}: Props) {
  const {
    items,
    total,
    clearCart,
  } = useCartStore()

  /*
   * Usa exactamente el mismo mecanismo
   * de impresión que la venta normal.
   */
  const { print } = usePrinter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateLayawayForm>({
    defaultValues: {
      clientName: '',
      clientPhone: '',
      deposit: '',
      paymentMethod: 1,
    },
  })

  const depositValue = watch('deposit')

  const paymentMethod = Number(
    watch('paymentMethod'),
  )

  const deposit =
    Number.parseFloat(
      depositValue || '0',
    ) || 0

  const remaining = Math.max(
    0,
    total - deposit,
  )

  const isFullyPaid =
    total > 0 &&
    deposit >= total

  const selectedPaymentMethod =
    paymentMethods.find(
      method =>
        method.value ===
        paymentMethod,
    )

  const mutation = useMutation({
    mutationFn: (
      data: CreateLayawayForm,
    ) =>
      layawaysApi.create({
        clientName:
          data.clientName.trim(),

        clientPhone:
          data.clientPhone.trim() ||
          undefined,

        deposit:
          Number.parseFloat(
            data.deposit || '0',
          ) || 0,

        paymentMethod:
          Number(
            data.paymentMethod,
          ),

        items: items.map(item => ({
          productId:
            item.product.id,

          quantity:
            item.quantity,
        })),
      }),

    onSuccess: async response => {
      const createdLayaway =
        response.data.data

      /*
       * El apartado ya quedó registrado.
       * La impresión no debe revertirlo si falla.
       */
      clearCart()

      if (!createdLayaway) {
        toast.success(
          'Apartado creado correctamente',
        )

        onSuccess()
        return
      }

      const completed =
        createdLayaway.status ===
          'Completed' ||
        Number(
          createdLayaway.remaining,
        ) <= 0

      try {
        const ticketText =
          buildLayawayTicketText(
            createdLayaway,
            completed
              ? 'layaway-completed'
              : 'layaway',
          )

        /*
         * Aquí se utiliza la misma función
         * print() de la venta normal.
         */
        await print(ticketText)
      } catch (error) {
        console.error(
          'El apartado se registró, pero el comprobante no se imprimió:',
          error,
        )

        toast.error(
          'El apartado se guardó, pero no se pudo imprimir el comprobante',
        )
      }

      if (completed) {
        toast.success(
          createdLayaway.saleFolio
            ? `Apartado liquidado — Venta: ${createdLayaway.saleFolio}`
            : 'Apartado liquidado correctamente',
          {
            duration: 4000,
          },
        )
      } else {
        toast.success(
          `Apartado ${createdLayaway.folio} creado`,
        )
      }

      onSuccess()
    },

    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ??
          'Error al crear apartado',
      )
    },
  })

  const submit = (
    data: CreateLayawayForm,
  ): void => {
    mutation.mutate(data)
  }

  if (items.length === 0) {
    return (
      <Modal
        title="Nuevo apartado"
        onClose={onClose}
        size="md"
      >
        <div className="py-12 text-center text-gray-400">
          <div className="mb-3 text-5xl">
            📦
          </div>

          <p className="font-medium text-gray-600">
            No hay productos en el carrito
          </p>

          <p className="mt-1 text-sm">
            Agrega productos en el carrito primero.
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Nuevo apartado"
      onClose={onClose}
      size="xl"
    >
      <div className="grid grid-cols-2 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-4">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Artículos a apartar
            </p>

            <div className="max-h-64 space-y-2.5 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-4">
              {items.map(item => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border bg-white shadow-sm">
                    {item.product.imageUrl ? (
                      <img
                        src={
                          item.product.imageUrl
                        }
                        alt={
                          item.product.name
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg">
                        📦
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {item.product.name}
                    </p>

                    <p className="text-xs text-gray-400">
                      {item.quantity} × $
                      {item.product.salePrice.toFixed(
                        2,
                      )}
                    </p>
                  </div>

                  <span className="shrink-0 font-bold text-gray-900">
                    $
                    {item.subtotal.toFixed(
                      2,
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-between px-1 font-bold text-gray-900">
              <span>
                Total del apartado
              </span>

              <span className="text-lg text-primary-600">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Resumen de pago */}
          <div
            className={`space-y-2 rounded-xl border p-4 text-sm ${
              isFullyPaid
                ? 'border-green-200 bg-green-50'
                : deposit > 0
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-gray-200 bg-gray-50'
            }`}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Resumen de pago
            </p>

            <div className="flex justify-between text-gray-600">
              <span>Total</span>

              <span>
                ${total.toFixed(2)}
              </span>
            </div>

            <div
              className={`flex justify-between font-medium ${
                deposit > 0
                  ? 'text-green-700'
                  : 'text-gray-400'
              }`}
            >
              <span>Anticipo</span>

              <span>
                ${deposit.toFixed(2)}
              </span>
            </div>

            {deposit > 0 && (
              <div className="flex justify-between text-xs font-medium opacity-70">
                <span>Método</span>

                <span>
                  {
                    selectedPaymentMethod?.emoji
                  }{' '}
                  {
                    selectedPaymentMethod?.label
                  }
                </span>
              </div>
            )}

            <div
              className={`flex justify-between border-t pt-2 font-bold ${
                isFullyPaid
                  ? 'border-green-200 text-green-800'
                  : 'border-gray-200 text-gray-900'
              }`}
            >
              <span>
                {isFullyPaid
                  ? '✅ Sin restante'
                  : 'Restante'}
              </span>

              <span>
                ${remaining.toFixed(2)}
              </span>
            </div>

            {isFullyPaid && (
              <p className="text-xs font-medium text-green-600">
                Se generará una venta automáticamente
              </p>
            )}
          </div>
        </div>

        {/* Columna derecha */}
        <form
          onSubmit={handleSubmit(submit)}
          className="space-y-5"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              👤 Nombre del cliente

              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              {...register(
                'clientName',
                {
                  required:
                    'El nombre es requerido',

                  minLength: {
                    value: 2,
                    message:
                      'Escribe un nombre válido',
                  },
                },
              )}
              className="input"
              placeholder="Juan García"
              autoFocus
            />

            {errors.clientName && (
              <p className="mt-1 text-xs text-red-500">
                {
                  errors.clientName
                    .message
                }
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              📞 Teléfono
            </label>

            <input
              {...register(
                'clientPhone',
              )}
              className="input"
              placeholder="614-000-0000"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              💰 Anticipo
            </label>

            <input
              {...register('deposit', {
                validate: value => {
                  const amount =
                    Number.parseFloat(
                      value || '0',
                    )

                  if (
                    Number.isNaN(
                      amount,
                    )
                  ) {
                    return 'Cantidad inválida'
                  }

                  if (amount < 0) {
                    return 'No puede ser negativo'
                  }

                  if (amount > total) {
                    return 'No puede superar el total'
                  }

                  return true
                },
              })}
              type="text"
              inputMode="decimal"
              className="input"
              placeholder="0.00"
            />

            {errors.deposit && (
              <p className="mt-1 text-xs text-red-500">
                {
                  errors.deposit
                    .message
                }
              </p>
            )}

            <p className="mt-1 text-xs text-gray-400">
              Deja en 0 si no hay anticipo
            </p>
          </div>

          {/* Método de pago */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              💳 Método de pago del anticipo
            </label>

            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map(
                ({
                  value,
                  emoji,
                  name,
                }) => (
                  <label
                    key={value}
                    className="cursor-pointer"
                  >
                    <input
                      {...register(
                        'paymentMethod',
                        {
                          valueAsNumber:
                            true,
                        },
                      )}
                      type="radio"
                      value={value}
                      className="peer sr-only"
                    />

                    <div
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-all hover:border-gray-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 ${
                        deposit === 0
                          ? 'border-gray-100 opacity-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <span className="text-xl">
                        {emoji}
                      </span>

                      <span className="text-sm font-medium text-gray-700">
                        {name}
                      </span>
                    </div>
                  </label>
                ),
              )}
            </div>

            {deposit === 0 && (
              <p className="mt-1.5 text-xs text-gray-400">
                El método aplica solo si hay anticipo
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={
                mutation.isPending
              }
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                mutation.isPending
              }
              className="btn-primary flex-1"
            >
              {mutation.isPending
                ? 'Guardando...'
                : 'Crear apartado'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}