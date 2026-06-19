import { DollarSign } from 'lucide-react'

interface Props {
  onOpen: () => void
}

export default function ClosedPanel({ onOpen }: Props) {
  return (
    <div className="card max-w-sm mx-auto text-center py-16">
      <DollarSign size={56} className="mx-auto text-black-200 mb-4" />

      <h2 className="text-lg font-semibold text-black-600">
        No hay caja abierta
      </h2>

      <p className="text-gray-400 text-sm mt-2 mb-8">
        Abre una caja para comenzar a operar
      </p>

      <button onClick={onOpen} className="btn-primary px-8">
        Abrir caja
      </button>
    </div>
  )
}