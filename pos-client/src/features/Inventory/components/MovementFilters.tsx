export type PeriodFilter = 'day' | 'week' | 'all'

type Props = {
  filterProd: string
  periodFilter: PeriodFilter
  onFilterProdChange: (value: string) => void
  onPeriodFilterChange: (value: PeriodFilter) => void
}

export default function MovementFilters({
  filterProd,
  periodFilter,
  onFilterProdChange,
  onPeriodFilterChange,
}: Props) {
  return (
    <div className="mb-4 flex flex-wrap gap-3 items-center">
      <input
        className="input max-w-sm text-base font-medium text-black placeholder:text-black"
        placeholder="Filtrar por producto..."
        value={filterProd}
        onChange={e => onFilterProdChange(e.target.value)}
      />

      <select
        className="input max-w-xs text-base font-medium text-black"
        value={periodFilter}
        onChange={e => onPeriodFilterChange(e.target.value as PeriodFilter)}
      >
        <option value="day">Movimientos de hoy</option>
        <option value="week">Movimientos de esta semana</option>
        <option value="all">Todos los movimientos</option>
      </select>
    </div>
  )
}