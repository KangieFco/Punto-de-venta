import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import { productsApi, type Product, type SaveProductRequest } from '../../api/products'
import { categoriesApi } from '../../api/categories'

interface Props {
  product: Product | null
  onClose: () => void
}

export default function ProductForm({ product, onClose }: Props) {
  const qc     = useQueryClient()
  const isEdit = !!product

  const { data: categories } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn:  () => categoriesApi.getAll(true).then(r => r.data.data ?? []),
  })

  const mapProductToDefaults = (p: Product) => ({
    ...p,
    // react-hook-form defaultValues expects optional fields to be undefined, not null
    barcode: p.barcode ?? undefined,
    description: p.description ?? undefined,
  })

  const { register, handleSubmit, formState: { errors } } =
    useForm<SaveProductRequest>({
      defaultValues: product
        ? mapProductToDefaults(product)
        : { unit: 'PZA', stock: 0, minStock: 0, costPrice: 0, salePrice: 0 }
    })

  const mutation = useMutation({
    mutationFn: (data: SaveProductRequest) =>
      isEdit
        ? productsApi.update(product!.id, data)
        : productsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success(isEdit ? 'Producto actualizado' : 'Producto creado')
      onClose()
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message ?? 'Error al guardar'),
  })

  return (
    <Modal
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      onClose={onClose}
      size="xl"
    >
      <form onSubmit={handleSubmit(d => mutation.mutate(d))}
            className="grid grid-cols-2 gap-4">

        {/* Código interno */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código interno <span className="text-red-500">*</span>
          </label>
          <input
            {...register('code', { required: 'Requerido' })}
            className="input"
            placeholder="COC001"
          />
          {errors.code && (
            <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>
          )}
        </div>

        {/* Código de barras */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código de barras
          </label>
          <input
            {...register('barcode')}
            className="input"
            placeholder="7501055300105"
          />
        </div>

        {/* Nombre */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name', { required: 'Requerido' })}
            className="input"
            placeholder="Coca-Cola 600ml"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría <span className="text-red-500">*</span>
          </label>
          <select
            {...register('categoryId', {
              required: 'Requerido',
              valueAsNumber: true
            })}
            className="input"
          >
            <option value="">Seleccionar...</option>
            {categories?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Unidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unidad <span className="text-red-500">*</span>
          </label>
          <select {...register('unit')} className="input">
            {['PZA','KG','LT','MT','CAJA','PAR','DOC'].map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Costo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio costo
          </label>
          <input
            {...register('costPrice', { valueAsNumber: true, min: 0 })}
            type="number" step="0.01" className="input"
            placeholder="0.00"
          />
        </div>

        {/* Precio venta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio venta <span className="text-red-500">*</span>
          </label>
          <input
            {...register('salePrice', {
              valueAsNumber: true,
              required: 'Requerido',
              min: { value: 0.01, message: 'Debe ser mayor a 0' }
            })}
            type="number" step="0.01" className="input"
            placeholder="0.00"
          />
          {errors.salePrice && (
            <p className="text-red-500 text-xs mt-1">{errors.salePrice.message}</p>
          )}
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock inicial
          </label>
          <input
            {...register('stock', { valueAsNumber: true, min: 0 })}
            type="number" className="input"
            placeholder="0"
          />
        </div>

        {/* Stock mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock mínimo
          </label>
          <input
            {...register('minStock', { valueAsNumber: true, min: 0 })}
            type="number" className="input"
            placeholder="0"
          />
        </div>

        {/* Descripción */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            {...register('description')}
            className="input resize-none"
            rows={2}
          />
        </div>

        {/* Botones */}
        <div className="col-span-2 flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </form>
    </Modal>
  )
}