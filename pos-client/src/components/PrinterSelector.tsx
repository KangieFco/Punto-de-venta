import { Printer, RefreshCw } from 'lucide-react'
import { usePrinter } from '../hooks/usePrinter'

export default function PrinterSelector() {
  const {
    printers,
    selectedPrinter,
    setSelectedPrinter,
    isLoadingPrinters,
    refreshPrinters,
  } = usePrinter()

  if (isLoadingPrinters) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
        <RefreshCw size={13} className="animate-spin" />
        <span>Buscando impresoras...</span>
      </div>
    )
  }

  if (printers.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400">
        <Printer size={13} className="opacity-50" />

        <span>Sin impresoras</span>

        <button
          type="button"
          onClick={() => void refreshPrinters()}
          className="ml-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-100"
        >
          Actualizar
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
      <Printer
        size={14}
        className={
          selectedPrinter
            ? 'shrink-0 text-green-500'
            : 'shrink-0 text-gray-400'
        }
      />

      <select
        value={selectedPrinter}
        onChange={(event) => {
          setSelectedPrinter(event.target.value)
        }}
        className="max-w-[220px] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-500"
      >
        <option value="">
          Selecciona una impresora
        </option>

        {printers.map((printer) => (
          <option key={printer} value={printer}>
            {printer}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => void refreshPrinters()}
        title="Actualizar impresoras"
        className="rounded-md border border-gray-300 bg-white p-1.5 text-gray-500 transition hover:bg-gray-100"
      >
        <RefreshCw size={13} />
      </button>
    </div>
  )
}