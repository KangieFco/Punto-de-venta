import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useRef, useState } from 'react'
import Modal from '../../components/ui/Modal'
import { productsApi, type Product, type SaveProductRequest } from '../../api/products'
import { categoriesApi } from '../../api/categories'
import { getImageUrl } from '../../utils/getImageUrl'

type ProductFormData = Omit<SaveProductRequest, 'code'>
interface Props {
  product: Product | null
  onClose: () => void
}

export default function ProductForm({ product, onClose }: Props) {
  const qc = useQueryClient()
  const isEdit = !!product
  const fileRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(
    getImageUrl(product?.imageUrl) ?? null
  )

  const [uploading, setUploading] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoriesApi.getAll(true).then(r => r.data.data ?? []),
  })

  const { register, handleSubmit, formState: { errors } } =
    useForm<ProductFormData>({
      defaultValues: product
        ? {
            barcode: product.barcode ?? '',
            name: product.name,
            description: product.description ?? '',
            categoryId: product.categoryId,
            costPrice: product.costPrice,
            salePrice: product.salePrice,
            stock: product.stock,
            minStock: product.minStock,
            unit: product.unit,
          }
          : {
              unit: 'PZA',
              stock: 0,
              minStock: 0,
              costPrice: 0,
            }
    })

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file || !product) return

    const temporalPreview = URL.createObjectURL(file)
    setPreview(temporalPreview)
    setUploading(true)

    try {
      const res = await productsApi.uploadImage(product.id, file)
      const savedImageUrl = res.data.data

      setPreview(getImageUrl(savedImageUrl))
      toast.success('Imagen actualizada')

      qc.invalidateQueries({ queryKey: ['products'] })
    } catch (err: any) {
    console.error(
      'Error al subir imagen completo:',
      JSON.stringify(err.response?.data, null, 2)
    )

    console.error('Errores:', err.response?.data?.errors)

    toast.error(
      err.response?.data?.message ??
        err.response?.data?.title ??
        'Error al subir imagen'
    )
    } finally {
      setUploading(false)
      URL.revokeObjectURL(temporalPreview)

      if (fileRef.current) {
        fileRef.current.value = ''
      }
    }
  }

  const mutation = useMutation({
    mutationFn: (data: ProductFormData) =>
      isEdit
        ? productsApi.update(product!.id, data as SaveProductRequest)
        : productsApi.create(data as SaveProductRequest),
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
      <form
        onSubmit={handleSubmit(d => mutation.mutate(d))}
        className="grid grid-cols-2 gap-4"
      >
        {/* Imagen del producto */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen del producto
          </label>

          <div className="flex items-center gap-4">
            <div className="w-28 h-28 rounded-xl border bg-gray-50 flex items-center justify-center overflow-hidden">
              {preview ? (
                <img
                  src={preview}
                  alt="Producto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-400 text-center px-2">
                  Sin imagen
                </span>
              )}
            </div>

            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={!isEdit || uploading}
                className="btn-secondary"
              >
                {uploading ? 'Subiendo...' : 'Subir imagen'}
              </button>

              {!isEdit && (
                <p className="text-xs text-gray-400 mt-2">
                  Primero guarda el producto para poder subir una imagen.
                </p>
              )}
            </div>
          </div>
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
              min: { value: 0.01, message: 'Debe ser mayor a 0' },
            })}
            type="number"
            step="0.01"
            className="input"
          />

          {errors.salePrice && (
            <p className="text-red-500 text-xs mt-1">
              {errors.salePrice.message}
            </p>
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
          />

          {errors.name && (
            <p className="text-red-500 text-xs mt-1">
              {errors.name.message}
            </p>
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
              valueAsNumber: true,
            })}
            className="input"
          >
            <option value="">Seleccionar...</option>

            {categories?.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {errors.categoryId && (
            <p className="text-red-500 text-xs mt-1">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        {/* Unidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unidad <span className="text-red-500">*</span>
          </label>

          <select {...register('unit')} className="input">
            {['PZA', 'KG', 'CAJA'].map(u => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Stock mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock mínimo
          </label>

          <input
            {...register('minStock', { valueAsNumber: undefined })}
            type="number"
            className="input"
          />
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock inicial
          </label>

          <input
            {...register('stock', { valueAsNumber: undefined })}
            type="number"
            className="input"
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
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={mutation.isPending || uploading}
            className="btn-primary"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </form>
    </Modal>
  )
}