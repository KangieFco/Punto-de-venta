import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Search,
  AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { productsApi, type Product } from '../../api/products'
import Badge from '../../components/ui/Badge'
import ProductForm from '../Products/ProductForm'
import { getImageUrl } from '../../utils/getImageUrl'

export default function ProductsPage() {
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Product | null | undefined>(undefined)

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll().then(r => r.data.data ?? []),
  })

  const filtered = data?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  ) ?? []

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} de {data?.length ?? 0} productos
          </p>
        </div>

        <button
          onClick={() => setEditing(null)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Nuevo producto
        </button>
      </div>

      {/* Buscador */}
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

      {/* Tabla */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Imagen
              </th>

              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Código
              </th>

              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Producto
              </th>

              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Categoría
              </th>

              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Precio
              </th>

              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Stock
              </th>

              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Estado
              </th>

              <th className="px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-12 text-gray-400"
                >
                  Cargando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-12 text-gray-400"
                >
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const imageSrc = getImageUrl(p.imageUrl)

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    {/* Imagen */}
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400">
                            Sin img
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Código */}
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {p.code}
                    </td>

                    {/* Producto */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {p.name}
                      </div>

                      {p.barcode && (
                        <div className="text-xs text-gray-400">
                          {p.barcode}
                        </div>
                      )}
                    </td>

                    {/* Categoría */}
                    <td className="px-4 py-3 text-gray-600">
                      {p.categoryName}
                    </td>

                    {/* Precio */}
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ${p.salePrice.toFixed(2)}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-medium ${
                          p.isLowStock ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {p.stock} {p.unit}
                      </span>

                      {p.isLowStock && (
                        <AlertTriangle
                          size={14}
                          className="inline ml-1 text-red-500"
                        />
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <Badge
                        label={p.active ? 'Activo' : 'Inactivo'}
                        variant={p.active ? 'green' : 'red'}
                      />
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setEditing(p)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="Editar producto"
                        >
                          <Pencil size={22} className="text-gray-500" />
                        </button>

                        <button
                          onClick={() => toggleMutation.mutate(p)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title={p.active ? 'Desactivar producto' : 'Activar producto'}
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
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <ProductForm
          product={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  )
}