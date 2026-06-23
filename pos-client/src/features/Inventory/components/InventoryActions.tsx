import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from 'lucide-react'

type ModalType = 'entry' | 'output' | 'adjustment' | null

type Permissions = {
  canAddEntry: boolean
  canAddOutput: boolean
  canAddAdjustment: boolean
}

type Props = {
  permissions: Permissions
  onOpenModal: (type: ModalType) => void
}

export default function InventoryActions({
  permissions,
  onOpenModal,
}: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-start gap-3">
      {permissions.canAddEntry && (
        <button
          onClick={() => onOpenModal('entry')}
          className="btn-secondary flex items-center gap-2 px-5 py-3 text-base font-semibold"
        >
          <ArrowDownCircle size={22} className="text-green-600" />
          Entrada
        </button>
      )}

      {permissions.canAddOutput && (
        <button
          onClick={() => onOpenModal('output')}
          className="btn-secondary flex items-center gap-2 px-5 py-3 text-base font-semibold"
        >
          <ArrowUpCircle size={22} className="text-red-600" />
          Salida
        </button>
      )}

      {permissions.canAddAdjustment && (
        <button
          onClick={() => onOpenModal('adjustment')}
          className="btn-primary flex items-center gap-2 px-5 py-3 text-base font-semibold"
        >
          <SlidersHorizontal size={22} />
          Ajuste
        </button>
      )}
    </div>
  )
}