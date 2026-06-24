import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { layawaysApi, type Layaway } from '../../api/layaways'
import { useAuthStore } from '../../store/authStore'
import LayawayTabs from '../../features/Layaways/components/LayawayTabs'
import LayawaysTable from '../Layaways/LayawaysTable'
import LayawayDetailModal from '../Layaways/Modal/LayawayDetailModal'
import AddDepositModal from '../Layaways/Modal/AddDepositModal'
import CreateLayawayModal from '../Layaways/Modal/CreateLayawayModal'

export default function LayawaysPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const canCancel = ['Admin', 'Supervisor', 'Cajero' ].includes(user?.role ?? '')

  const [filter, setFilter] = useState<string>('Pending')
  const [detail, setDetail] = useState<Layaway | null>(null)
  const [creating, setCreating] = useState(false)
  const [depositing, setDepositing] = useState<Layaway | null>(null)

  const { data: layaways, isLoading } = useQuery({
    queryKey: ['layaways', filter],
    queryFn: () =>
      layawaysApi.getAll(filter || undefined).then(r => r.data.data ?? []),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => layawaysApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['layaways'] })
      toast.success('Apartado cancelado')
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Error'),
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apartados</h1>
          <p className="text-gray-500 text-sm mt-1"> {layaways?.length ?? 0} apartados</p>
        </div>

        <button
          onClick={() => setCreating(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Nuevo apartado
        </button>
      </div>

      <LayawayTabs filter={filter} setFilter={setFilter} />

      <LayawaysTable
        layaways={layaways}
        isLoading={isLoading}
        canCancel={canCancel}
        onDetail={setDetail}
        onDeposit={setDepositing}
        onCancel={id => cancelMutation.mutate(id)}
      />

      {creating && (
        <CreateLayawayModal
          onClose={() => setCreating(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['layaways'] })
            setCreating(false)
          }}
        />
      )}

      {detail && (
        <LayawayDetailModal layaway={detail} onClose={() => setDetail(null)} />
      )}

      {depositing && (
        <AddDepositModal
          layaway={depositing}
          onClose={() => setDepositing(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['layaways'] })
            setDepositing(null)
          }}
        />
      )}
    </div>
  )
}