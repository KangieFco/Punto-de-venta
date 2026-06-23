import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../../api/inventory'
import { productsApi } from '../../api/products'
import { usePermissions } from '../../hooks/usePermissions'
import InventoryActions from '../../features/Inventory/components/InventoryActions'
import StockTable from '../../features/Inventory/components/StockTable'
import MovementFilters, { type PeriodFilter } from '../../features/Inventory/components/MovementFilters'
import MovementsTable from '../../Pages/Inventory/MovementsTable'
import MovementsPagination from '../../features/Inventory/components/MovementPagination'
import InventoryModal from './Modal/InventoryModal'

type ModalType = 'entry' | 'output' | 'adjustment' | null

const MOVEMENTS_PER_PAGE = 10

export default function InventoryPage() {
  const qc = useQueryClient()
  const permissions = usePermissions()

  const [modal, setModal] = useState<ModalType>(null)
  const [filterProd, setFilterProd] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('day')
  const [page, setPage] = useState(1)

  const { data: movements, isLoading } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => inventoryApi.getMovements().then(r => r.data.data ?? []),
  })

  const { data: products } = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => productsApi.getAll(true).then(r => r.data.data ?? []),
  })

  const filtered = useMemo(() => {
    const today = new Date()

    return (movements ?? [])
      .filter(m => {
        if (filterProd) {
          const matchesProduct = m.productName
            .toLowerCase()
            .includes(filterProd.toLowerCase())

          if (!matchesProduct) return false
        }

        const movementDate = new Date(m.createdAt)

        if (periodFilter === 'day') {
          return movementDate.toDateString() === today.toDateString()
        }

        if (periodFilter === 'week') {
          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - today.getDay())
          startOfWeek.setHours(0, 0, 0, 0)

          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 7)

          return movementDate >= startOfWeek && movementDate < endOfWeek
        }

        return true
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }, [movements, filterProd, periodFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / MOVEMENTS_PER_PAGE))

  const paginatedMovements = filtered.slice(
    (page - 1) * MOVEMENTS_PER_PAGE,
    page * MOVEMENTS_PER_PAGE
  )

  return (
    <div className="p-8 text-base text-black">
      <InventoryActions permissions={permissions} onOpenModal={setModal} />

      <StockTable products={products ?? []} />

      <MovementFilters
        filterProd={filterProd}
        periodFilter={periodFilter}
        onFilterProdChange={value => {
          setFilterProd(value)
          setPage(1)
        }}
        onPeriodFilterChange={value => {
          setPeriodFilter(value)
          setPage(1)
        }}
      />

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-black">
            Historial de movimientos
          </h2>
        </div>

        <MovementsTable
          movements={paginatedMovements}
          filteredCount={filtered.length}
          isLoading={isLoading}
        />

        {filtered.length > 0 && (
          <MovementsPagination
            page={page}
            totalPages={totalPages}
            showing={paginatedMovements.length}
            total={filtered.length}
            onPrevious={() => setPage(prev => Math.max(prev - 1, 1))}
            onNext={() => setPage(prev => Math.min(prev + 1, totalPages))}
          />
        )}
      </div>

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