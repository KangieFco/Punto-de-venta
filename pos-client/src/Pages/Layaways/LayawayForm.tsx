import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { DollarSign, Package, Phone, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { layawaysApi } from '../../api/layaways'
import { useCartStore } from '../../store/cartStore'
import Modal from '../../components/ui/Modal'

type CreateLayawayModalProps = {
  onClose: () => void
  onSuccess: () => void
}

type CreateLayawayForm = {
  clientName: string
  clientPhone: string
  deposit: number
}

export default function CreateLayawayModal({
  onClose,
  onSuccess,
}: CreateLayawayModalProps) {
  const { items, total, clearCart } = useCartStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLayawayForm>({
    defaultValues: undefined,
  })

  const mutation = useMutation({
    mutationFn: (d: CreateLayawayForm) =>
      layawaysApi.create({
        clientName: d.clientName,
        clientPhone: d.clientPhone || undefined,
        deposit: d.deposit,
        paymentMethod: 1,
        items: items.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      }),

    onSuccess: () => {
      clearCart()
      toast.success('Apartado creado')
      onSuccess()
    },

    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? 'Error'),
  })

  if (items.length === 0) {
    return (
      <Modal title="Nuevo apartado" onClose={onClose} size="sm">
        <div className="text-center py-8 text-gray-400">
          <Package size={65} className="mx-auto mb-3 opacity-40" />
          <p>No hay productos en el carrito.</p>
          <p className="text-sm mt-1">
            Agrega productos en el POS primero.
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Nuevo apartado" onClose={onClose} size="md">
      {/* Productos del carrito */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Artículos a apartar</p>
        {items.map(i => (
          <div key={i.product.id} className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-gray-200 overflow-hidden shrink-0">
              {i.product.imageUrl ? (
                <img
                  src={i.product.imageUrl}
                  alt={i.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package size={16} className="m-auto mt-1 text-gray-400" />
              )}
            </div>

            <span className="flex-1 truncate text-gray-700">
              {i.product.name}
              <span className="text-gray-400 ml-1">×{i.quantity}</span>
            </span>
            <span className="font-medium"> ${i.subtotal.toFixed(2)} </span>
          </div>
        ))}

        <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Formulario del cliente */}
      <form
        onSubmit={handleSubmit(d => mutation.mutate(d))}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <User size={14} className="inline mr-1" />
            Nombre del cliente <span className="text-red-500">*</span>
          </label>

          <input
            {...register('clientName', { required: 'Requerido' })}
            className="input"
          />

          {errors.clientName && (
            <p className="text-red-500 text-xs mt-1"> {errors.clientName.message} </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Phone size={14} className="inline mr-1" />
            Teléfono opcional
          </label>

          <input
            {...register('clientPhone')}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <DollarSign size={18} className="inline mr-1" />
            Anticipo $
          </label>

          <input
            {...register('deposit', {
              valueAsNumber: true,
              min: {
                value: 0,
                message: 'No puede ser negativo',
              },
            })}
            type="text"
            inputMode="decimal"
            className="input"
          />

          {errors.deposit && (
            <p className="text-red-500 text-xs mt-1">
              {errors.deposit.message}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Guardando...' : 'Crear apartado'}
          </button>
        </div>
      </form>
    </Modal>
  )
}