type Props = {
  page: number
  totalPages: number
  showing: number
  total: number
  onPrevious: () => void
  onNext: () => void
}

export default function MovementsPagination({
  page,
  totalPages,
  showing,
  total,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t">
      <p className="text-sm text-black">
        Mostrando {showing} de {total} movimientos
      </p>

      <div className="flex items-center gap-2">
        <button
          className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={page === 1}
          onClick={onPrevious}
        >
          Anterior
        </button>

        <span className="text-sm font-semibold text-black">
          Página {page} de {totalPages}
        </span>

        <button
          className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={page === totalPages}
          onClick={onNext}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}