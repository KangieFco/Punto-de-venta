import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import { categoriesApi, type Category, type SaveCategoryRequest } from '../../api/categories'

interface Props {
  category: Category | null
  onClose:  () => void
}

export default function CategoryForm({ category, onClose }: Props) {
  const qc      = useQueryClient()
  const isEdit  = !!category

  const { register, handleSubmit, formState: { errors } } =
    useForm<SaveCategoryRequest>({
      defaultValues: {
        name:        category?.name        ?? '',
        description: category?.description ?? '',
      }
    })

  const mutation = useMutation({
    mutationFn: (data: SaveCategoryRequest) =>
      isEdit
        ? categoriesApi.update(category!.id, data)
        : categoriesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success(isEdit ? 'Categoría actualizada' : 'Categoría creada')
      onClose()
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message ?? 'Error al guardar'),
  })

  return (
    <Modal
      title={isEdit ? 'Editar categoría' : 'Nueva categoría'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name', { required: 'El nombre es requerido' })}
            className="input"
            placeholder="Ej: Bebidas"
            autoFocus
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            {...register('description')}
            className="input resize-none"
            rows={3}
            placeholder="Descripción opcional"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}