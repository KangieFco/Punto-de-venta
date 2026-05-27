import { Printer, Wifi, WifiOff } from 'lucide-react'
import { usePrinter } from '../hooks/usePrinter'

export default function PrinterSelector() {
  const { printers, selected, connected, loading, connect, selectPrinter } =
    usePrinter()

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-sm">
        {connected
          ? <Wifi size={14} className="text-green-500" />
          : <WifiOff size={14} className="text-gray-400" />
        }
        <span className="text-gray-500">
          {connected ? 'QZ Tray conectado' : 'QZ Tray desconectado'}
        </span>
      </div>

      {connected ? (
        <select
          value={selected}
          onChange={e => selectPrinter(e.target.value)}
          className="input max-w-xs text-sm"
        >
          <option value="">Sin impresora</option>
          {printers.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      ) : (
        <button
          onClick={connect}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 text-sm py-1.5"
        >
          <Printer size={15} />
          {loading ? 'Conectando...' : 'Conectar impresora'}
        </button>
      )}
    </div>
  )
}