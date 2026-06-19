import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { cashRegistersApi } from '../../../api/cashRegisters'
import Modal from '../../../components/ui/Modal'

interface Props {
  type: 'in' | 'out'
  onClose: () => void
  onSuccess: () => void
}

interface FormValues {
  amount: string
  reason: string
}

export default function MovementModal({ type, onClose, onSuccess }: Props) {
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      amount: '',
      reason: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      type === 'in'
        ? cashRegistersApi.addIncoming({
            amount: Number(data.amount),
            reason: data.reason,
          })
        : cashRegistersApi.addOutgoing({
            amount: Number(data.amount),
            reason: data.reason,
          }),
    onSuccess: () => {
      toast.success(type === 'in' ? 'Ingreso registrado' : 'Retiro registrado')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? 'Error')
    },
  })

  return (
    <Modal
      title={type === 'in' ? 'Registrar ingreso' : 'Registrar retiro'}
      onClose={onClose}
      size="sm"
    >
      <form
        onSubmit={handleSubmit(data => mutation.mutate(data))}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto ($)
          </label>

          <input
            {...register('amount', { required: 'Requerido' })}
            type="text"
            inputMode="decimal"
            className="input text-xl font-bold text-center"
            placeholder="0.00"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo
          </label>

          <input
            {...register('reason')}
            className="input"
            placeholder="Ej: Cambio para caja"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className={type === 'in' ? 'btn-primary' : 'btn-danger'}
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}