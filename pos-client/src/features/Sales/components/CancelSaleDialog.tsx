import { useForm } from 'react-hook-form'
import type { Sale } from '../../../api/sales'
import Modal from '../../../components/ui/Modal'

type Props = {
  sale: Sale
  onClose: () => void
  onConfirm: (reason: string) => void
  loading: boolean
}

type FormValues = {
  reason: string
}

export default function CancelSaleDialog({
  sale,
  onClose,
  onConfirm,
  loading,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>()

  return (
    <Modal title="Cancelar venta" onClose={onClose} size="sm">
      <form
        onSubmit={handleSubmit(data => onConfirm(data.reason))}
        className="space-y-4"
      >
        <p className="text-base text-gray-600">
          ¿Cancelar la venta <strong>{sale.folio}</strong>? Se revertirá el inventario.
        </p>

        <div>
          <label className="block text-base font-medium text-gray-700 mb-1">
            Motivo <span className="text-red-500">*</span>
          </label>

          <input
            {...register('reason', {
              required: 'El motivo es requerido',
            })}
            className="input"
            placeholder="Ej: Error en cobro"
            autoFocus
          />

          {errors.reason && (
            <p className="text-red-500 text-sm mt-1">
              {errors.reason.message}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            No cancelar
          </button>

          <button type="submit" disabled={loading} className="btn-danger">
            {loading ? 'Cancelando...' : 'Sí, cancelar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}