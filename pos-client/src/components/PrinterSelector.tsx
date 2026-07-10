import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import { connectQz, getPrinters, getSavedPrinter, savePrinter } from '../services/printService'

export default function PrinterSelector() {
  const [printerName, setPrinterName] = useState<string>(
    getSavedPrinter() ?? ''
  )
  const [connected, setConnected] = useState(false)

  // Intentar conectar y detectar impresora al montar
  useEffect(() => {
    const init = async () => {
      try {
        await connectQz()
        const list = await getPrinters()
        setConnected(true)

        // Si hay una guardada y existe en la lista, usarla
        const saved = getSavedPrinter()
        if (saved && list.includes(saved)) {
          setPrinterName(saved)
          return
        }
        // Si solo hay una, seleccionarla automáticamente
        if (list.length === 1) {
          savePrinter(list[0])
          setPrinterName(list[0])
        }
      } catch {
        setConnected(false)
      }
    }

    void init()
  }, [])

  if (!connected) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
        <Printer size={13} className="opacity-50" />
        <span>Sin impresora</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
      <Printer size={13} className="text-green-500 shrink-0" />
      <span className="max-w-[160px] truncate font-medium">
        {printerName || 'Sin impresora'}
      </span>
    </div>
  )
}