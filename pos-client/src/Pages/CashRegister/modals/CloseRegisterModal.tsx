import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { cashRegistersApi, type CashRegister, type CashMovement, type CashRegisterCloseResult } from '../../../api/cashRegisters'
import Modal from '../../../components/ui/Modal'
import { getExpectedCash, getTotalIn, getTotalOut } from '../../../../src/utils/cashRegisterCalculations'

interface Props {
  register: CashRegister
  movements: CashMovement[]
  onClose: () => void
  onSuccess: (result: CashRegisterCloseResult) => void
}

interface FormValues {
  closingAmount: string
}

export default function CloseRegisterModal({
  register: reg,
  movements,
  onClose,
  onSuccess,
}: Props) {
  const { register, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      closingAmount: '',
    },
  })

  const closing = Number(watch('closingAmount')) || 0
  const totalIn = getTotalIn(movements)
  const totalOut = getTotalOut(movements)
  const expectedCash = getExpectedCash(reg.openingAmount, movements)
  const diff = closing - expectedCash

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      cashRegistersApi.close(reg.id, Number(data.closingAmount)),
    onSuccess: (res) => {
      toast.success('Caja cerrada')
      onSuccess(res.data.data!)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? 'Error')
    },
  })

  return (
    <Modal title="Cerrar caja" onClose={onClose} size="sm">
      <form
        onSubmit={handleSubmit(data => mutation.mutate(data))}
        className="space-y-4"
      >
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-black-600">
            <span>Fondo inicial</span>
            <span>${reg.openingAmount.toFixed(2)}</span>
          </div>

          {totalIn > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Ingresos manuales</span>
              <span>+${totalIn.toFixed(2)}</span>
            </div>
          )}

          {totalOut > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Retiros</span>
              <span>-${totalOut.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
            <span>Efectivo esperado</span>
            <span>${expectedCash.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-black-700 mb-1">
            Monto contado en caja ($)
          </label>

          <input
            {...register('closingAmount', { required: 'Requerido' })}
            type="text"
            inputMode="decimal"
            className="input text-xl font-bold text-center"
            placeholder={expectedCash.toFixed(2)}
            autoFocus
          />
        </div>

        {closing > 0 && (
          <div
            className={`rounded-xl p-3 text-center text-sm font-semibold ${
              diff === 0
                ? 'bg-green-50 text-green-700 border border-green-200'
                : diff > 0
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {diff === 0 && '✅ Caja cuadrada perfectamente'}
            {diff > 0 && `📈 Sobrante: +$${diff.toFixed(2)}`}
            {diff < 0 && `📉 Faltante: -$${Math.abs(diff).toFixed(2)}`}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-danger"
          >
            {mutation.isPending ? 'Cerrando...' : 'Cerrar y ver resumen'}
          </button>
        </div>
      </form>
    </Modal>
  )
}