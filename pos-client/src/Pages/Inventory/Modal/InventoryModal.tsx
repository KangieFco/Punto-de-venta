import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { Product } from '../../../api/products'
import { inventoryApi } from '../../../api/inventory'
import Modal from '../../../components/ui/Modal'

type ActiveModalType = 'entry' | 'output' | 'adjustment'

interface InventoryForm {
  productId: number
  quantity: number
  newStock: number
  reason: string
}

type Props = {
  type: ActiveModalType
  products: Product[]
  onClose: () => void
  onSuccess: () => void
}

export default function InventoryModal({
  type,
  products,
  onClose,
  onSuccess,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InventoryForm>({
    defaultValues: {
      quantity: 1,
      newStock: 0,
    },
  })

  const selectedId = watch('productId')
  const selectedProd = products.find(p => p.id === Number(selectedId))

  const titles = {
    entry: 'Registrar entrada',
    output: 'Registrar salida',
    adjustment: 'Ajuste de inventario',
  }

  const mutation = useMutation({
    mutationFn: (data: InventoryForm) => {
      if (type === 'entry') {
        return inventoryApi.entry({
          productId: Number(data.productId),
          quantity: data.quantity,
          reason: data.reason,
        })
      }

      if (type === 'output') {
        return inventoryApi.output({
          productId: Number(data.productId),
          quantity: data.quantity,
          reason: data.reason,
        })
      }

      return inventoryApi.adjustment({
        productId: Number(data.productId),
        newStock: data.newStock,
        reason: data.reason,
      })
    },
    onSuccess: () => {
      toast.success('Movimiento registrado')
      onSuccess()
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? 'Error')
    },
  })

  return (
    <Modal title={titles[type]} onClose={onClose} size="sm">
      <form
        onSubmit={handleSubmit(data => mutation.mutate(data))}
        className="space-y-5 text-base text-black"
      >
        <div>
          <label className="block text-base font-bold text-black mb-2">
            Producto <span className="text-red-500">*</span>
          </label>

          <select
            {...register('productId', { required: 'Requerido' })}
            className="input text-base font-medium text-black"
          >
            <option value="">Seleccionar...</option>

            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} (Stock: {product.stock})
              </option>
            ))}
          </select>

          {errors.productId && (
            <p className="text-red-500 text-sm mt-1">
              {errors.productId.message}
            </p>
          )}
        </div>

        {type === 'adjustment' ? (
          <div>
            <label className="block text-base font-semibold text-black mb-2">
              Stock nuevo
              {selectedProd && (
                <span className="text-black text-sm ml-2">
                  (actual: {selectedProd.stock})
                </span>
              )}
            </label>

            <input
              {...register('newStock', {
                valueAsNumber: true,
                required: 'Requerido',
                min: { value: 0, message: 'No puede ser negativo' },
              })}
              type="number"
              className="input text-base text-black placeholder:text-black"
            />

            {errors.newStock && (
              <p className="text-red-500 text-sm mt-1">
                {errors.newStock.message}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-base font-semibold text-black mb-2">
              Cantidad <span className="text-red-500">*</span>
            </label>

            <input
              {...register('quantity', {
                valueAsNumber: true,
                required: 'Requerido',
                min: { value: 1, message: 'Mínimo 1' },
              })}
              type="number"
              className="input text-base text-black placeholder:text-black"
            />

            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-base font-semibold text-black mb-2">
            Motivo
          </label>

          <input
            {...register('reason')}
            className="input text-base text-black placeholder:text-black"
            placeholder="Ej: Compra a proveedor"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-5 py-3 text-base font-semibold"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary px-5 py-3 text-base font-semibold"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}