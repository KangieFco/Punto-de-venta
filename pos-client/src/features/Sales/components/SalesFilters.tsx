export type PeriodFilter = 'day' | 'week' | 'all'

type Props = {
  search: string
  periodFilter: PeriodFilter
  onSearchChange: (value: string) => void
  onPeriodFilterChange: (value: PeriodFilter) => void
}

export default function SalesFilters({
  search,
  periodFilter,
  onSearchChange,
  onPeriodFilterChange,
}: Props) {
  return (
    <div className="mb-4 flex flex-wrap gap-3 items-center">
      <input
        className="input max-w-sm text-base font-medium"
        placeholder="Buscar por folio, cajero, pago o estado..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
      />

      <select
        className="input max-w-xs text-base font-medium"
        value={periodFilter}
        onChange={e => onPeriodFilterChange(e.target.value as PeriodFilter)}
      >
        <option value="day">Ventas de hoy</option>
        <option value="week">Ventas de esta semana</option>
        <option value="all">Todas las ventas</option>
      </select>
    </div>
  )
}