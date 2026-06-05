import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, History } from 'lucide-react'
import { inventoryApi } from '../../api/inventory'
import { productsApi, type Product } from '../../api/products'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { usePermissions } from '../../hooks/usePermissions'

type ModalType = 'entry' | 'output' | 'adjustment' | null
type ActiveModalType = Exclude<ModalType, null>

export default function InventoryPage() {
  const qc = useQueryClient()
  const p = usePermissions()
  const [modal, setModal] = useState<ModalType>(null)
  const [filterProd, setFilterProd] = useState('')
  const { data: movements, isLoading } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => inventoryApi.getMovements().then(r => r.data.data ?? []),
  })
  const { data: products } = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => productsApi.getAll(true).then(r => r.data.data ?? []),
  })
  const filtered = movements?.filter(m =>
    !filterProd ||
    m.productName.toLowerCase().includes(filterProd.toLowerCase())
  ) ?? []

  const typeLabel = (t: string) => ({
    Entry: { label: 'Entrada', variant: 'green' },
    Output: { label: 'Salida', variant: 'red' },
    SalePending: { label: 'Venta', variant: 'blue' },
    CancellationReturn: { label: 'Devolución', variant: 'yellow' },
    Adjustment: { label: 'Ajuste', variant: 'gray' },
  }[t] ?? { label: t, variant: 'gray' }) as {
    label: string
    variant: 'green' | 'red' | 'blue' | 'yellow' | 'gray'
  }

  return (
    <div className="p-8 text-base text-black">
      <div className="mb-6 flex flex-wrap items-center justify-start gap-3">
        {p.canAddEntry && (
          <button
            onClick={() => setModal('entry')}
            className="btn-secondary flex items-center gap-2 px-5 py-3 text-base font-semibold"
          >
            <ArrowDownCircle size={22} className="text-green-600" />
            Entrada
          </button>
        )}

        {p.canAddOutput && (
          <button
            onClick={() => setModal('output')}
            className="btn-secondary flex items-center gap-2 px-5 py-3 text-base font-semibold"
          >
            <ArrowUpCircle size={22} className="text-red-600" />
            Salida
          </button>
        )}

        {p.canAddAdjustment && (
          <button
            onClick={() => setModal('adjustment')}
            className="btn-primary flex items-center gap-2 px-5 py-3 text-base font-semibold"
          >
            <SlidersHorizontal size={22} />
            Ajuste
          </button>
        )}
      </div>

      {/* Stock actual por producto */}
      <div className="card mb-6 overflow-hidden p-0">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <History size={22} className="text-black" />
          <h2 className="text-xl font-bold text-black">Stock actual</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-4 font-bold text-black">
                  Producto
                </th>
                <th className="text-left px-4 py-4 font-bold text-black">
                  Categoría
                </th>
                <th className="text-center px-4 py-4 font-bold text-black">
                  Stock
                </th>
                <th className="text-center px-4 py-4 font-bold text-black">
                  Mínimo
                </th>
                <th className="text-left px-4 py-4 font-bold text-black">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {products?.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="text-base font-small text-black">
                      {p.name}
                    </div>
                    <div className="text-sm font-small text-black">
                      {p.code}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-base font-small text-black">
                    {p.categoryName}
                  </td>
                  <td className="px-8 py-6 text-center font-small text-black">
                    <span className={p.isLowStock ? 'text-red-600' : 'text-black'}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-base font-small text-black">
                    {p.minStock}
                  </td>

                  <td className="px-4 py-4">
                    <Badge
                      label={p.isLowStock ? 'Bajo stock' : 'OK'}
                      variant={p.isLowStock ? 'red' : 'green'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filtro de historial */}
      <div className="mb-4">
        <input
          className="input max-w-sm text-base font-medium text-black placeholder:text-black"
          placeholder="Filtrar por producto..."
          value={filterProd}
          onChange={e => setFilterProd(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-black">
            Historial de movimientos
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-4 font-bold text-black">
                  Producto
                </th>
                <th className="text-left px-4 py-4 font-bold text-black">
                  Tipo
                </th>
                <th className="text-center px-4 py-4 font-bold text-black">
                  Cantidad
                </th>
                <th className="text-center px-4 py-4 font-bold text-black">
                  Antes
                </th>
                <th className="text-center px-4 py-4 font-bold text-black">
                  Después
                </th>
                <th className="text-left px-4 py-4 font-bold text-black">
                  Motivo
                </th>
                <th className="text-left px-4 py-4 font-bold text-black">
                  Usuario
                </th>
                <th className="text-left px-4 py-4 font-bold text-black">
                  Fecha
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-base font-sm text-black">
                    Cargando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-base font-sm text-black">
                    Sin movimientos
                  </td>
                </tr>
              ) : filtered.map(m => {
                const { label, variant } = typeLabel(m.movementType)

                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-8 py-6 text-black-700 font-small">
                      {m.productName}
                    </td>
                    <td className="px-4 py-4">
                      <Badge label={label} variant={variant} />
                    </td>
                    <td className="px-8 py-6 text-center text-black-700 font-small">
                      {m.quantity}
                    </td>
                    <td className="px-8 py-6 text-center text-black-700 font-small">
                      {m.previousStock}
                    </td>
                    <td className="px-8 py-6 text-center text-black-700 font-small">
                      {m.newStock}
                    </td>
                    <td className="px-8 py-6 text-black-700 font-small">
                      {m.reason ?? m.reference ?? '—'}
                    </td>
                    <td className="px-8 py-6 text-black-700 font-small">
                      {m.userFullName}
                    </td>
                    <td className="px-4 py-4 text-base font-sm text-black whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString('es-MX')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {modal && (
        <InventoryModal
          type={modal}
          products={products ?? []}
          onClose={() => setModal(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['inventory-movements'] })
            qc.invalidateQueries({ queryKey: ['products'] })
            setModal(null)
          }}
        />
      )}
    </div>
  )
}

interface InventoryForm {
  productId: number
  quantity: number
  newStock: number
  reason: string
}

function InventoryModal({
  type,
  products,
  onClose,
  onSuccess,
}: {
  type: ActiveModalType
  products: Product[]
  onClose: () => void
  onSuccess: () => void
}) {
  const { register, handleSubmit, watch, formState: { errors } } =
    useForm<InventoryForm>({
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
    mutationFn: (d: InventoryForm) => {
      if (type === 'entry') {
        return inventoryApi.entry({
          productId: Number(d.productId),
          quantity: d.quantity,
          reason: d.reason,
        })
      }

      if (type === 'output') {
        return inventoryApi.output({
          productId: Number(d.productId),
          quantity: d.quantity,
          reason: d.reason,
        })
      }

      return inventoryApi.adjustment({
        productId: Number(d.productId),
        newStock: d.newStock,
        reason: d.reason,
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
        onSubmit={handleSubmit(d => mutation.mutate(d))}
        className="space-y-5 text-base text-black"
      >
        {/* Producto */}
        <div>
          <label className="block text-base font-bold text-black mb-2">
            Producto <span className="text-red-500">*</span>
          </label>

          <select
            {...register('productId', { required: 'Requerido' })}
            className="input text-base font-medium text-black"
          >
            <option value="">Seleccionar...</option>

            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Stock: {p.stock})
              </option>
            ))}
          </select>

          {errors.productId && (
            <p className="text-red-500 text-sm font-sm mt-1">
              {errors.productId.message}
            </p>
          )}
        </div>

        {/* Cantidad o stock nuevo */}
        {type === 'adjustment' ? (
          <div>
            <label className="block text-base font-semibold text-black mb-2">
              Stock nuevo

              {selectedProd && (
                <span className="text-black font-sm ml-2">
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
              className="input text-base font-sm text-black placeholder:text-black"
            />
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
              className="input text-base font-sm placeholder:text-black" 
            />

            {errors.quantity && (
              <p className="text-red-500 text-sm font-sm mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>
        )}

        {/* Motivo */}
        <div>
          <label className="block text-base font-semibold text-black mb-2">
            Motivo
          </label>

          <input
            {...register('reason')}
            className="input text-base font-sm text-black placeholder:text-black"
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