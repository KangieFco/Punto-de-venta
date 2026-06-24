import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { Layaway } from '../../../api/layaways'
import { layawaysApi } from '../../../api/layaways'
import Modal from '../../../components/ui/Modal'

type Props = {
  layaway: Layaway
  onClose: () => void
  onSuccess: () => void
}

type FormValues = {
  amount: number
  paymentMethod: number
}

export default function AddDepositModal({ layaway, onClose, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      paymentMethod: 1,
    },
  })

  const amount = Number(watch('amount')) || 0

  const mutation = useMutation({
    mutationFn: (d: FormValues) =>
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

          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Guardando...' : 'Registrar abono'}
          </button>
        </div>
      </form>
    </Modal>
  )
}