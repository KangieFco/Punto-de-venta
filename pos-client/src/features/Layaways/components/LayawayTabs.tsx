type Props = {
  filter: string

  setFilter: (
    value: string,
  ) => void
}

const tabs = [
  {
    key: 'Pending',
    label: 'Pendientes',
  },
  {
    key: 'Completed',
    label: 'Completados',
  },
  {
    key: 'Cancelled',
    label: 'Cancelados',
  },
  {
    key: 'Expired',
    label: 'Vencidos',
  },
  {
    key: '',
    label: 'Todos',
  },
]

export default function LayawayTabs({
  filter,
  setFilter,
}: Props) {
  return (
    <div className="mb-6 flex gap-1 border-b">
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          onClick={() =>
            setFilter(tab.key)
          }
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            filter === tab.key
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}