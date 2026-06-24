type Props = {
  filter: string
  setFilter: (value: string) => void
}

const tabs = [
  { key: 'Pending', label: 'Pendientes' },
  { key: 'Completed', label: 'Completados' },
  { key: 'Cancelled', label: 'Cancelados' },
  { key: 'Expired', label: 'Vencidos' },
  { key: '', label: 'Todos' },
]

export default function LayawayTabs({ filter, setFilter }: Props) {
  return (
    <div className="flex gap-1 mb-6 border-b">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => setFilter(t.key)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            filter === t.key
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}