interface Props {
  label: string
  value: string
  color: 'gray' | 'green' | 'red' | 'blue'
  small?: boolean
}

export default function StatCard({ label, value, color, small }: Props) {
  const colors: Record<Props['color'], string> = {
    gray: 'bg-gray-50 border-gray-100',
    green: 'bg-green-50 border-green-100',
    red: 'bg-red-50 border-red-100',
    blue: 'bg-blue-50 border-blue-100',
  }

  const text: Record<Props['color'], string> = {
    gray: 'text-gray-800',
    green: 'text-green-800',
    red: 'text-red-800',
    blue: 'text-blue-800',
  }

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>

      <p className={`font-black ${small ? 'text-sm' : 'text-xl'} ${text[color]}`}>
        {value}
      </p>
    </div>
  )
}