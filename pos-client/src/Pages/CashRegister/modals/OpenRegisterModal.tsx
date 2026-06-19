import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { cashRegistersApi } from '../../../api/cashRegisters'
import Modal from '../../../components/ui/Modal'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

interface FormValues {
  openingAmount: string
}

export default function OpenRegisterModal({ onClose, onSuccess }: Props) {
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      openingAmount: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      cashRegistersApi.open(Number(data.openingAmount)),
    onSuccess: () => {
      toast.success('Caja abierta')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? 'Error')
    },
  })

  return (
    <Modal title="Abrir caja" onClose={onClose} size="sm">
      <form
        onSubmit={handleSubmit(data => mutation.mutate(data))}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-black-700 mb-1">
            Fondo inicial ($)
          </label>

          <input
            {...register('openingAmount', { required: 'Requerido' })}
            type="text"
            inputMode="decimal"
            className="input text-xl font-bold text-center"
            autoFocus
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Abriendo...' : 'Abrir caja'}
          </button>
        </div>
      </form>
    </Modal>
  )
}