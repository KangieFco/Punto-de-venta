import { useMutation } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'

import type { Layaway } from '../../../api/layaways'
import { layawaysApi } from '../../../api/layaways'
import Modal from '../../../components/ui/Modal'
import { usePrinter } from '../../../hooks/usePrinter'

import {
  buildLayawayTicketText,
  type LayawayPaymentInfo,
} from '../../../features/Layaways/utils/layawayTicket'

type Props = {
  layaway: Layaway
  onClose: () => void
  onSuccess: () => void
}

type FormValues = {
  amount: number
  paymentMethod: number
  exchangeRate: number
}

type DepositVariables = {
  appliedAmount: number
  paymentMethod: number
  paymentInfo: LayawayPaymentInfo
}

const PAYMENT_METHOD = {
  CASH: 1,
  CARD: 2,
  DOLLAR: 4,
} as const

const PAYMENT_METHODS = [
  {
    value: PAYMENT_METHOD.CASH,
    emoji: '💵',
    name: 'Efectivo',
  },
  {
    value: PAYMENT_METHOD.CARD,
    emoji: '💳',
    name: 'Tarjeta',
  },
  {
    value: PAYMENT_METHOD.DOLLAR,
    emoji: '🇺🇸',
    name: 'Dólares',
  },
]

export default function AddDepositModal({
  layaway,
  onClose,
  onSuccess,
}: Props) {
  const { print } = usePrinter()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      amount: undefined as unknown as number,
      paymentMethod: PAYMENT_METHOD.CASH,
      exchangeRate: 17,
    },
  })

  const amount =
    Number(
      useWatch({
        control,
        name: 'amount',
      }),
    ) || 0

  const paymentMethod =
    Number(
      useWatch({
        control,
        name: 'paymentMethod',
      }),
    ) || PAYMENT_METHOD.CASH

  const exchangeRate =
    Number(
      useWatch({
        control,
        name: 'exchangeRate',
      }),
    ) || 1

  const isCash =
    paymentMethod === PAYMENT_METHOD.CASH

  const isCard =
    paymentMethod === PAYMENT_METHOD.CARD

  const isDollar =
    paymentMethod === PAYMENT_METHOD.DOLLAR

  /*
   * En efectivo, amount ya está expresado en MXN.
   * En dólares, amount está expresado en USD y
   * se convierte a pesos.
   */
  const receivedInMxn = isDollar
    ? amount * exchangeRate
    : amount

  /*
   * Solo se aplica al apartado el saldo que falta.
   * El excedente será cambio.
   */
  const appliedAmount =
    isCash || isDollar
      ? Math.min(
          receivedInMxn,
          Number(layaway.remaining),
        )
      : receivedInMxn

  /*
   * Tarjeta no genera cambio.
   * Efectivo y dólares sí pueden generar cambio.
   */
  const changeInMxn =
    isCash || isDollar
      ? Math.max(
          0,
          receivedInMxn -
            Number(layaway.remaining),
        )
      : 0

  const changeInUsd =
    isDollar &&
    exchangeRate > 0 &&
    changeInMxn > 0
      ? changeInMxn / exchangeRate
      : 0

  const newRemaining = Math.max(
    0,
    Number(layaway.remaining) -
      appliedAmount,
  )

  const mutation = useMutation({
    mutationFn: (
      variables: DepositVariables,
    ) =>
      layawaysApi.addDeposit(
        layaway.id,
        variables.appliedAmount,
        variables.paymentMethod,
      ),

    onSuccess: async (
      response,
      variables,
    ) => {
      const updated =
        response.data.data

      if (!updated) {
        toast.success(
          'Abono registrado',
        )

        onSuccess()
        return
      }

      const completed =
        updated.status ===
          'Completed' ||
        Number(updated.remaining) <= 0

      if (completed) {
        try {
          const ticketText =
            buildLayawayTicketText(
              updated,
              'layaway-completed',
              variables.paymentInfo,
            )

          await print(ticketText)
        } catch (error) {
          console.error(
            'El apartado se liquidó, pero no se imprimió:',
            error,
          )

          toast.error(
            'El apartado se liquidó, pero no se pudo imprimir el ticket',
          )
        }

        toast.success(
          updated.saleFolio
            ? `Apartado liquidado — Venta: ${updated.saleFolio}`
            : 'Apartado liquidado',
          {
            duration: 4000,
          },
        )
      } else {
        toast.success(
          'Abono registrado',
        )
      }

      onSuccess()
    },

    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ??
          'Error al registrar el abono',
      )
    },
  })

  const submit = (
    data: FormValues,
  ): void => {
    const enteredAmount =
      Number(data.amount)

    const method =
      Number(data.paymentMethod)

    const rate =
      Number(data.exchangeRate) || 1

    const dollarPayment =
      method === PAYMENT_METHOD.DOLLAR

    const cashPayment =
      method === PAYMENT_METHOD.CASH

    const cardPayment =
      method === PAYMENT_METHOD.CARD

    const receivedMxn =
      dollarPayment
        ? enteredAmount * rate
        : enteredAmount

    /*
     * Tarjeta no puede exceder el saldo.
     */
    if (
      cardPayment &&
      receivedMxn >
        Number(layaway.remaining)
    ) {
      toast.error(
        'El pago con tarjeta no puede superar el saldo restante',
      )

      return
    }

    const amountToApply =
      cashPayment || dollarPayment
        ? Math.min(
            receivedMxn,
            Number(
              layaway.remaining,
            ),
          )
        : receivedMxn

    const changeMxn =
      cashPayment || dollarPayment
        ? Math.max(
            0,
            receivedMxn -
              Number(
                layaway.remaining,
              ),
          )
        : 0

    const changeUsd =
      dollarPayment &&
      rate > 0 &&
      changeMxn > 0
        ? changeMxn / rate
        : 0

    const paymentInfo: LayawayPaymentInfo = {
      paymentMethod: method,
      receivedAmount:
        enteredAmount,
      receivedInMxn:
        receivedMxn,
      appliedAmount:
        amountToApply,
      exchangeRate:
        dollarPayment
          ? rate
          : undefined,
      changeInMxn:
        changeMxn,
      changeInUsd:
        dollarPayment
          ? changeUsd
          : undefined,
    }

    mutation.mutate({
      appliedAmount:
        amountToApply,
      paymentMethod:
        method,
      paymentInfo,
    })
  }

  return (
    <Modal
      title="Agregar abono"
      onClose={onClose}
      size="sm"
    >
      <form
        onSubmit={handleSubmit(submit)}
        className="space-y-4"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Método de abono
          </label>

          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(
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

                  <div className="flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-gray-200 px-3 py-2.5 transition-all hover:border-gray-300 peer-checked:border-primary-500 peer-checked:bg-primary-50">
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
        </div>

        {isDollar && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <label className="mb-2 block text-sm font-medium text-blue-700">
              Tipo de cambio — 1 USD =
            </label>

            <div className="flex items-center gap-2">
              <input
                {...register(
                  'exchangeRate',
                  {
                    valueAsNumber:
                      true,

                    required:
                      'Requerido',

                    min: {
                      value: 1,
                      message:
                        'Tipo de cambio inválido',
                    },
                  },
                )}
                type="number"
                step="0.01"
                inputMode="decimal"
                className="input text-center font-bold"
              />

              <span className="text-sm font-medium text-blue-600">
                MXN
              </span>
            </div>

            {errors.exchangeRate && (
              <p className="mt-1 text-xs text-red-500">
                {
                  errors.exchangeRate
                    .message
                }
              </p>
            )}

            <p className="mt-2 text-center text-xs text-blue-600">
              Saldo equivalente: $
              {(
                Number(
                  layaway.remaining,
                ) / exchangeRate
              ).toFixed(2)}{' '}
              USD
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {isDollar
              ? 'Monto recibido (USD)'
              : 'Monto recibido ($MXN)'}
          </label>

          <input
            {...register('amount', {
              valueAsNumber: true,

              required:
                'Requerido',

              min: {
                value: 0.01,
                message:
                  'Debe ser mayor a 0',
              },

              validate: value => {
                if (
                  !Number.isFinite(
                    value,
                  )
                ) {
                  return 'Ingresa una cantidad válida'
                }

                if (
                  isCard &&
                  value >
                    Number(
                      layaway.remaining,
                    )
                ) {
                  return 'No puede superar el restante'
                }

                return true
              },
            })}
            type="number"
            step="0.01"
            inputMode="decimal"
            className="input text-center text-xl font-bold"
            placeholder={
              isDollar
                ? (
                    Number(
                      layaway.remaining,
                    ) /
                    exchangeRate
                  ).toFixed(2)
                : Number(
                    layaway.remaining,
                  ).toFixed(2)
            }
            autoFocus
          />

          {errors.amount && (
            <p className="mt-1 text-sm text-red-500">
              {
                errors.amount
                  .message
              }
            </p>
          )}

          {isDollar &&
            amount > 0 && (
              <p className="mt-1 text-center text-xs text-blue-500">
                ≈ $
                {receivedInMxn.toFixed(
                  2,
                )}{' '}
                MXN
              </p>
            )}
        </div>

        {amount > 0 && (
          <div
            className={`space-y-2 rounded-xl p-3 text-sm ${
              newRemaining <= 0
                ? 'bg-green-50 text-green-700'
                : 'bg-orange-50 text-orange-700'
            }`}
          >
            <div className="flex justify-between">
              <span>
                Monto aplicado
              </span>

              <span className="font-bold">
                $
                {appliedAmount.toFixed(
                  2,
                )}
              </span>
            </div>

            {newRemaining > 0 ? (
              <div className="flex justify-between">
                <span>Restará</span>

                <span className="font-bold">
                  $
                  {newRemaining.toFixed(
                    2,
                  )}
                </span>
              </div>
            ) : (
              <p className="text-center font-bold">
                El apartado queda completado
              </p>
            )}

            {changeInMxn > 0 && (
              <div className="border-t border-green-200 pt-2">
                <div className="flex justify-between text-base">
                  <span>
                    Cambio a entregar
                  </span>

                  <span className="font-black">
                    $
                    {changeInMxn.toFixed(
                      2,
                    )}{' '}
                    MXN
                  </span>
                </div>

                {isDollar &&
                  changeInUsd > 0 && (
                    <p className="mt-1 text-right text-xs">
                      ≈ $
                      {changeInUsd.toFixed(
                        2,
                      )}{' '}
                      USD
                    </p>
                  )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={
              mutation.isPending
            }
            className="btn-secondary"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={
              mutation.isPending
            }
            className="btn-primary"
          >
            {mutation.isPending
              ? 'Guardando...'
              : 'Registrar abono'}
          </button>
        </div>
      </form>
    </Modal>
  )
}