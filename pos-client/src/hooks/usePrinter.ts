import { useState, useEffect } from 'react'
import { connectQz, getPrinters, printTicket, disconnectQz } from '../utils/qzTray'
import toast from 'react-hot-toast'

const PRINTER_KEY = 'pos_printer'

export function usePrinter() {
  const [printers,  setPrinters]  = useState<string[]>([])
  const [selected,  setSelected]  = useState<string>(
    localStorage.getItem(PRINTER_KEY) ?? ''
  )
  const [connected, setConnected] = useState(false)
  const [loading,   setLoading]   = useState(false)

  const connect = async () => {
    setLoading(true)
    try {
      const list = await getPrinters()
      setPrinters(list)
      setConnected(true)
      if (!selected && list.length > 0) {
        setSelected(list[0])
        localStorage.setItem(PRINTER_KEY, list[0])
      }
    } catch {
      toast.error('No se pudo conectar con QZ Tray. ¿Está instalado y corriendo?')
    } finally {
      setLoading(false)
    }
  }

  const selectPrinter = (name: string) => {
    setSelected(name)
    localStorage.setItem(PRINTER_KEY, name)
  }

  const print = async (ticketText: string) => {
    if (!selected) {
      toast.error('Selecciona una impresora primero')
      return false
    }
    try {
      await printTicket(selected, ticketText)
      return true
    } catch (err: any) {
      toast.error('Error al imprimir: ' + (err.message ?? 'desconocido'))
      return false
    }
  }

  return { printers, selected, connected, loading, connect, selectPrinter, print }
}