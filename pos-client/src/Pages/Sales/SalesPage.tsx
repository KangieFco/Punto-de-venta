import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { salesApi, type Sale } from '../../api/sales'
import { useAuthStore } from '../../store/authStore'
import SalesFilters, { type PeriodFilter } from '../../features/Sales/components/SalesFilters'
import SalesTable from '../../Pages/Sales/SalesTable'
import SalesPagination from '../../features/Sales/components/SalesPagination'
import SaleDetailModal from '../../Pages/Sales/modal/SaleDetailModal'
import CancelSaleDialog from '../../features/Sales/components/CancelSaleDialog'
import { getLocalDateKey } from '../../utils/date'

const SALES_PER_PAGE = 10
const TIME_ZONE = 'America/Chihuahua'

function getWeekRangeKeys(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(date)
  const year = Number(parts.find(p => p.type === 'year')?.value)
  const month = Number(parts.find(p => p.type === 'month')?.value)
  const day = Number(parts.find(p => p.type === 'day')?.value)

  const localDate = new Date(year, month - 1, day)
  const startOfWeek = new Date(localDate)
  startOfWeek.setDate(localDate.getDate() - localDate.getDay())

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  return {
    start: getLocalDateKey(startOfWeek),
    end: getLocalDateKey(endOfWeek),
  }
}

export default function SalesPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const canCancel = ['Admin', 'Supervisor'].includes(user?.role ?? '')

  const [detail, setDetail] = useState<Sale | null>(null)
  const [cancelling, setCancelling] = useState<Sale | null>(null)
  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('day')
  const [page, setPage] = useState(1)

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesApi.getAll().then(r => r.data.data ?? []),
  })

  const filteredSales = useMemo(() => {
    const todayKey = getLocalDateKey(new Date())
    const weekRange = getWeekRangeKeys()

    return (sales ?? [])
      .filter(s => {
        const term = search.toLowerCase().trim()

        if (term) {
          const matchesSearch =
            s.folio.toLowerCase().includes(term) ||
            s.userFullName.toLowerCase().includes(term) ||
            s.paymentMethod.toLowerCase().includes(term) ||
            s.status.toLowerCase().includes(term)
          if (!matchesSearch) return false
        }

        const saleDateKey = getLocalDateKey(s.createdAt)

        if (periodFilter === 'day') {
          return saleDateKey === todayKey
        }

        if (periodFilter === 'week') {
          return saleDateKey >= weekRange.start && saleDateKey <= weekRange.end
        }

        return true
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }, [sales, search, periodFilter])

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / SALES_PER_PAGE))

  const paginatedSales = filteredSales.slice(
    (page - 1) * SALES_PER_PAGE,
    page * SALES_PER_PAGE
  )

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      salesApi.cancel(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['inventory-movements'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Venta cancelada')
      setCancelling(null)
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? 'Error al cancelar'),
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
        <p className="text-gray-500 text-base mt-1">
          {filteredSales.length} de {sales?.length ?? 0} ventas registradas
        </p>
      </div>

      <SalesFilters
        search={search}
        periodFilter={periodFilter}
        onSearchChange={value => {
          setSearch(value)
          setPage(1)
        }}
        onPeriodFilterChange={value => {
          setPeriodFilter(value)
          setPage(1)
        }}
      />

      <div className="card overflow-hidden p-0">
        <SalesTable
          sales={paginatedSales}
          filteredCount={filteredSales.length}
          isLoading={isLoading}
          canCancel={canCancel}
          onDetail={setDetail}
          onCancel={setCancelling}
        />

        {filteredSales.length > 0 && (
          <SalesPagination
            page={page}
            totalPages={totalPages}
            showing={paginatedSales.length}
            total={filteredSales.length}
            onPrevious={() => setPage(prev => Math.max(prev - 1, 1))}
            onNext={() => setPage(prev => Math.min(prev + 1, totalPages))}
          />
        )}
      </div>

      {detail && (
        <SaleDetailModal sale={detail} onClose={() => setDetail(null)} />
      )}

      {cancelling && (
        <CancelSaleDialog
          sale={cancelling}
          onClose={() => setCancelling(null)}
          onConfirm={reason =>
            cancelMutation.mutate({ id: cancelling.id, reason })
          }
          loading={cancelMutation.isPending}
        />
      )}
    </div>
  )
}