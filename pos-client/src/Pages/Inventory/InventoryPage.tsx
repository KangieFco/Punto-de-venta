import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, History } from 'lucide-react'
import { inventoryApi, type InventoryMovement } from '../../api/inventory'
import { productsApi, type Product } from '../../api/products'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'

type ModalType = 'entry' | 'output' | 'adjustment' | null

export default function InventoryPage() {
  const qc = useQueryClient()
  const [modal,      setModal]      = useState<ModalType>(null)
  const [filterProd, setFilterProd] = useState('')

  const { data: movements, isLoading } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn:  () => inventoryApi.getMovements().then(r => r.data.data ?? []),
  })

  const { data: products } = useQuery({
    queryKey: ['products', 'active'],
    queryFn:  () => productsApi.getAll(true).then(r => r.data.data ?? []),
  })

  const filtered = movements?.filter(m =>
    !filterProd ||
    m.productName.toLowerCase().includes(filterProd.toLowerCase())
  ) ?? []

  const typeLabel = (t: string) => ({
    Entry:              { label: 'Entrada',     variant: 'green'  },
    Output:             { label: 'Salida',      variant: 'red'    },
    SalePending:        { label: 'Venta',       variant: 'blue'   },
    CancellationReturn: { label: 'Devolución',  variant: 'yellow' },
    Adjustment:         { label: 'Ajuste',      variant: 'gray'   },
  }[t] ?? { label: t, variant: 'gray' }) as
    { label: string; variant: 'green'|'red'|'blue'|'yellow'|'gray' }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} movimientos
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setModal('entry')}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowDownCircle size={18} className="text-green-600" />
            Entrada
          </button>
          <button
            onClick={() => setModal('output')}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowUpCircle size={18} className="text-red-600" />
            Salida
          </button>
          <button
            onClick={() => setModal('adjustment')}
            className="btn-primary flex items-center gap-2"
          >
            <SlidersHorizontal size={18} />
            Ajuste
          </button>
        </div>
      </div>

      {/* Stock actual por producto */}
      <div className="card mb-6 overflow-hidden p-0">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <History size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Stock actual</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Producto
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Categoría
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Stock
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Mínimo
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products?.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.code}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.categoryName}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    <span className={p.isLowStock
                      ? 'text-red-600' : 'text-gray-900'}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {p.minStock}
                  </td>
                  <td className="px-4 py-3">
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
          className="input max-w-sm"
          placeholder="Filtrar por producto..."
          value={filterProd}
          onChange={e => setFilterProd(e.target.value)}
        />
      </div>

      {/* Historial de movimientos */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Historial de movimientos</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Producto
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Tipo
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Cant.
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Antes
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Después
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Motivo
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Usuario
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  Cargando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  Sin movimientos
                </td>
              </tr>
            ) : filtered.map(m => {
              const { label, variant } = typeLabel(m.movementType)
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {m.productName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={label} variant={variant} />
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {m.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {m.previousStock}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">
                    {m.newStock}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {m.reason ?? m.reference ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.userFullName}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString('es-MX')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
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

// ── Modal de movimiento ────────────────────────────────────────

interface InventoryForm {
  productId: number
  quantity:  number
  newStock:  number
  reason:    string
}

function InventoryModal({ type, products, onClose, onSuccess }: {
  type:      ModalType
  products:  Product[]
  onClose:   () => void
  onSuccess: () => void
}) {
  const { register, handleSubmit, watch, formState: { errors } } =
    useForm<InventoryForm>({ defaultValues: { quantity: 1, newStock: 0 } })

  const selectedId   = watch('productId')
  const selectedProd = products.find(p => p.id === Number(selectedId))

  const titles = {
    entry:      'Registrar entrada',
    output:     'Registrar salida',
    adjustment: 'Ajuste de inventario',
  }

  const mutation = useMutation({
    mutationFn: (d: InventoryForm) => {
      if (type === 'entry')
        return inventoryApi.entry({
          productId: Number(d.productId),
          quantity:  d.quantity,
          reason:    d.reason
        })
      if (type === 'output')
        return inventoryApi.output({
          productId: Number(d.productId),
          quantity:  d.quantity,
          reason:    d.reason
        })
      return inventoryApi.adjustment({
        productId: Number(d.productId),
        newStock:  d.newStock,
        reason:    d.reason
      })
    },
    onSuccess: () => {
      toast.success('Movimiento registrado')
      onSuccess()
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? 'Error'),
  })

  return (
    <Modal title={titles[type!]} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))}
            className="space-y-4">
        {/* Producto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Producto <span className="text-red-500">*</span>
          </label>
          <select
            {...register('productId', { required: 'Requerido' })}
            className="input"
          >
            <option value="">Seleccionar...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Stock: {p.stock})
              </option>
            ))}
          </select>
          {errors.productId && (
            <p className="text-red-500 text-xs mt-1">
              {errors.productId.message}
            </p>
          )}
        </div>

        {/* Cantidad o stock nuevo */}
        {type === 'adjustment' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock nuevo
              {selectedProd && (
                <span className="text-gray-400 font-normal ml-2">
                  (actual: {selectedProd.stock})
                </span>
              )}
            </label>
            <input
              {...register('newStock', {
                valueAsNumber: true,
                required: 'Requerido',
                min: { value: 0, message: 'No puede ser negativo' }
              })}
              type="number" className="input" placeholder="0"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad <span className="text-red-500">*</span>
            </label>
            <input
              {...register('quantity', {
                valueAsNumber: true,
                required: 'Requerido',
                min: { value: 1, message: 'Mínimo 1' }
              })}
              type="number" className="input" placeholder="1"
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>
        )}

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo
          </label>
          <input
            {...register('reason')}
            className="input"
            placeholder="Ej: Compra a proveedor"
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