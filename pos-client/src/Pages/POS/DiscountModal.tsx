import { useForm } from 'react-hook-form'
import Modal from '../../components/ui/Modal'
import { useCartStore } from '../../store/cartStore'
import { Tag, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props { onClose: () => void }
interface DiscountForm { type: 'fixed' | 'percent'; value: number }

export default function DiscountModal({ onClose }: Props) {
  const { subtotal, globalDiscount, setGlobalDiscount } = useCartStore()
  const { register, handleSubmit, watch, formState: { errors } } =
    useForm<DiscountForm>({
      defaultValues: { type: 'fixed', value: 0 }
    })

  const type  = watch('type')
  const value = Number(watch('value')) || 0
  const previewDiscount = type === 'percent'
    ? (subtotal * value) / 100
    : value

  const previewTotal = Math.max(0, subtotal - previewDiscount)

  const onSubmit = (data: DiscountForm) => {
    const disc = data.type === 'percent'
      ? (subtotal * Number(data.value)) / 100
      : Number(data.value)

    if (disc > subtotal) {
      toast.error('El descuento no puede ser mayor al subtotal')
      return
    }

    setGlobalDiscount(disc)
    toast.success(`Descuento de $${disc.toFixed(2)} aplicado`)
    onClose()
  }

  const removeDiscount = () => {
    setGlobalDiscount(0)
    toast.success('Descuento eliminado')
    onClose()
  }

  return (
    <Modal title="Aplicar descuento" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de descuento
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'fixed',   label: '$ Monto fijo'  },
              { value: 'percent', label: '% Porcentaje'  },
            ].map(opt => (
              <label key={opt.value} className="cursor-pointer">
                <input
                  {...register('type')}
                  type="radio"
                  value={opt.value}
                  className="sr-only peer"
                />
                <div className="text-center border-2 border-gray-200 rounded-xl py-2.5 text-sm font-medium cursor-pointer peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:text-primary-700 hover:border-gray-300 transition-all">
                  {opt.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === 'percent' ? 'Porcentaje (%)' : 'Monto ($MXN)'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
              {type === 'percent' ? '%' : '$'}
            </span>
            <input
              {...register('value', {
                required: 'Ingresa un valor',
                min: { value: 0.01, message: 'Debe ser mayor a 0' },
              })}
              type="text"
              inputMode="decimal"
              className="input pl-8 text-lg font-bold"
              placeholder={type === 'percent' ? '10' : '50.00'}
              autoFocus
            />
          </div>
          {errors.value && (
            <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>
          )}
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
            Vista previa
          </p>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-orange-700 font-medium">
            <span>Descuento</span>
            <span>-${previewDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t border-orange-200 pt-2">
            <span>Total a cobrar</span>
            <span className="text-primary-600 text-lg">
              ${previewTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          {globalDiscount > 0 && (
            <button
              type="button"
              onClick={removeDiscount}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
            >
              <X size={14} /> Quitar
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Tag size={15} /> Aplicar
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}