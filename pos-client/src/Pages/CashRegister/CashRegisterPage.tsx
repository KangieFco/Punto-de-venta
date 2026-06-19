import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { type CashRegisterCloseResult } from '../../api/cashRegisters'
import ClosedPanel from '../../features/CashRegister/components/ClosedPanel'
import OpenedPanel from '../../features/CashRegister/components/OpenedPanel'
import OpenRegisterModal from '../../Pages/CashRegister/modals/OpenRegisterModal'
import CloseRegisterModal from '../../Pages/CashRegister/modals/CloseRegisterModal'
import CloseResultModal from '../../Pages/CashRegister/modals/CloseResultModal'
import MovementModal from '../../Pages/CashRegister/modals/MovementModal'
import { useCashRegister } from '../../hooks/useCashRegister'

export default function CashRegisterPage() {
  const qc = useQueryClient()

  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [inModal, setInModal] = useState(false)
  const [outModal, setOutModal] = useState(false)
  const [closeResult, setCloseResult] =
    useState<CashRegisterCloseResult | null>(null)

  const { current, movements, isLoading } = useCashRegister()

  if (isLoading) {
    return <div className="p-8 text-gray-400">Cargando...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Caja</h1>

        <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              current ? 'bg-green-500' : 'bg-red-400'
            }`}
          />
          {current ? 'Abierta' : 'Cerrada'}
        </p>
      </div>

      {!current ? (
        <ClosedPanel onOpen={() => setOpenModal(true)} />
      ) : (
        <OpenedPanel
          register={current}
          movements={movements}
          onClose={() => setCloseModal(true)}
          onIn={() => setInModal(true)}
          onOut={() => setOutModal(true)}
        />
      )}

      {openModal && (
        <OpenRegisterModal
          onClose={() => setOpenModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['cash-register'] })
            setOpenModal(false)
          }}
        />
      )}

      {closeModal && current && (
        <CloseRegisterModal
          register={current}
          movements={movements}
          onClose={() => setCloseModal(false)}
          onSuccess={(result) => {
            qc.invalidateQueries({ queryKey: ['cash-register'] })
            qc.invalidateQueries({ queryKey: ['cash-movements'] })
            setCloseModal(false)
            setCloseResult(result)
          }}
        />
      )}

      {inModal && (
        <MovementModal
          type="in"
          onClose={() => setInModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['cash-movements'] })
            setInModal(false)
          }}
        />
      )}

      {outModal && (
        <MovementModal
          type="out"
          onClose={() => setOutModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['cash-movements'] })
            setOutModal(false)
          }}
        />
      )}

      {closeResult && (
        <CloseResultModal
          result={closeResult}
          onClose={() => setCloseResult(null)}
        />
      )}
    </div>
  )
}