import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { categoriesApi, type Category } from '../../api/categories'
import Badge from '../../components/ui/Badge'
import CategoryForm from '../Categories/CategoryForm'

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Category | null | undefined>(undefined)

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then(r => r.data.data ?? []),
  })

  const toggleMutation = useMutation({
    mutationFn: (cat: Category) =>
      cat.active
        ? categoriesApi.deactivate(cat.id)
        : categoriesApi.activate(cat.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoría actualizada')
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message ?? 'Error'),
  })

  return (
    <div className="p-8 text-base text-black">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-black">Categorías</h1>
          <p className="text-base font-normal text-black mt-1">
            {data?.length ?? 0} categorías registradas
          </p>
        </div>

        <button
          onClick={() => setEditing(null)}
          className="btn-primary flex items-center gap-2 px-5 py-3 text-base font-semibold"
        >
          <Plus size={22} />
          Nueva categoría
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-4 font-bold text-black">Nombre</th>
                <th className="text-left px-4 py-4 font-bold text-black">Descripción</th>
                <th className="text-left px-4 py-4 font-bold text-black">Estado</th>
                <th className="text-left px-4 py-4 font-bold text-black">Creada</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-base font-normal text-black"
                  >
                    Cargando...
                  </td>
                </tr>
              ) : data?.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-base font-normal text-black"
                  >
                    No hay categorías
                  </td>
                </tr>
              ) : (
                data?.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-base font-medium text-black">
                      {cat.name}
                    </td>

                    <td className="px-6 py-4 text-base font-normal text-black">
                      {cat.description ?? '—'}
                    </td>

                    <td className="px-8 py-6">
                      <Badge
                        label={cat.active ? 'Activa' : 'Inactiva'}
                        variant={cat.active ? 'green' : 'red'}
                      />
                    </td>

                    <td className="px-6 py-4 text-base font-normal text-black">
                      {new Date(cat.createdAt).toLocaleDateString('es-MX')}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditing(cat)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={22} className="text-black" />
                        </button>

                        <button
                          onClick={() => toggleMutation.mutate(cat)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title={cat.active ? 'Desactivar' : 'Activar'}
                        >
                          {cat.active ? (
                            <ToggleRight size={28} className="text-green-600" />
                          ) : (
                            <ToggleLeft size={28} className="text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== undefined && (
        <CategoryForm
          category={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  )
}