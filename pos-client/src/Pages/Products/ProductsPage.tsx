import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, ToggleLeft, ToggleRight, Search, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { productsApi, type Product } from '../../api/products'
import Badge from '../../components/ui/Badge'
import ProductForm from '../Products/ProductForm'
import { getImageUrl } from '../../utils/getImageUrl'
import { usePermissions } from '../../hooks/usePermissions'

export default function ProductsPage() {
  const qc = useQueryClient()

  const {
    canCreateProduct,
    canEditProduct,
    canToggleProduct,
  } = usePermissions()

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Product | null | undefined>(undefined)

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll().then(r => r.data.data ?? []),
  })

  const filtered = (data ?? [])
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search)
    )
    .sort((a, b) => Number(a.code) - Number(b.code))

  const toggleMutation = useMutation({
    mutationFn: (p: Product) =>
      p.active ? productsApi.deactivate(p.id) : productsApi.activate(p.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Producto actualizado')
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message ?? 'Error'),
  })

  return (
    <div className="p-8 text-base text-black">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-black">Productos</h1>
          <p className="text-base font-normal text-black mt-1">
            {filtered.length} de {data?.length ?? 0} productos
          </p>
        </div>

        {canCreateProduct && (
          <button
            onClick={() => setEditing(null)}
            className="btn-primary flex items-center gap-2 px-5 py-3 text-base font-semibold"
          >
            <Plus size={22} />
            Nuevo producto
          </button>
        )}
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          className="input pl-9"
          placeholder="Buscar por nombre, código o barras..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-4 font-bold text-black">Imagen</th>
                <th className="text-left px-4 py-4 font-bold text-black">Código</th>
                <th className="text-left px-4 py-4 font-bold text-black">Producto</th>
                <th className="text-left px-4 py-4 font-bold text-black">Código de barras</th>
                <th className="text-left px-4 py-4 font-bold text-black">Categoría</th>
                <th className="text-right px-4 py-4 font-bold text-black">Precio</th>
                <th className="text-right px-4 py-4 font-bold text-black">Stock</th>
                <th className="text-left px-4 py-4 font-bold text-black">Estado</th>

                {(canEditProduct || canToggleProduct) && (
                  <th className="px-4 py-4" />
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={canEditProduct || canToggleProduct ? 9 : 8}
                    className="text-center py-12 text-base font-normal text-black"
                  >
                    Cargando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEditProduct || canToggleProduct ? 9 : 8}
                    className="text-center py-12 text-base font-normal text-black"
                  >
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const imageSrc = getImageUrl(p.imageUrl)

                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm text-black">
                              Sin img
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-base font-normal text-black">
                        {p.code}
                      </td>

                      <td className="px-4 py-4 text-base font-medium text-black">
                        {p.name}
                      </td>

                      <td className="px-4 py-4 text-left font-normal text-black">
                        {p.barcode || '—'}
                      </td>

                      <td className="px-4 py-4 text-base font-normal text-black">
                        {p.categoryName}
                      </td>

                      <td className="px-4 py-4 text-right text-base font-normal text-black">
                        ${p.salePrice.toFixed(2)}
                      </td>

                      <td className="px-4 py-4 text-right text-base font-normal">
                        <span className={p.isLowStock ? 'text-red-600' : 'text-black'}>
                          {p.stock} {p.unit}
                        </span>

                        {p.isLowStock && (
                          <AlertTriangle
                            size={18}
                            className="inline ml-1 text-red-500"
                          />
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          label={p.active ? 'Activo' : 'Inactivo'}
                          variant={p.active ? 'green' : 'red'}
                        />
                      </td>

                      {(canEditProduct || canToggleProduct) && (
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 justify-end">
                            {canEditProduct && (
                              <button
                                onClick={() => setEditing(p)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                title="Editar producto"
                              >
                                <Pencil size={22} className="text-black" />
                              </button>
                            )}

                            {canToggleProduct && (
                              <button
                                onClick={() => toggleMutation.mutate(p)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                title={
                                  p.active
                                    ? 'Desactivar producto'
                                    : 'Activar producto'
                                }
                              >
                                {p.active ? (
                                  <ToggleRight
                                    size={28}
                                    className="text-green-600"
                                  />
                                ) : (
                                  <ToggleLeft
                                    size={28}
                                    className="text-gray-400"
                                  />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== undefined && canCreateProduct && editing === null && (
        <ProductForm
          product={editing}
          onClose={() => setEditing(undefined)}
        />
      )}

      {editing !== undefined && canEditProduct && editing !== null && (
        <ProductForm
          product={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  )
}