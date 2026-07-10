import { useCallback, useEffect, useState } from 'react'
import qz from 'qz-tray'

const PRINTER_STORAGE_KEY = 'pos-selected-printer'

export function usePrinter() {
  const [printers, setPrinters] = useState<string[]>([])

  const [selectedPrinter, setSelectedPrinterState] =
    useState<string>(() => {
      return (
        localStorage.getItem(PRINTER_STORAGE_KEY) ?? ''
      )
    })

  const [isLoadingPrinters, setIsLoadingPrinters] =
    useState(false)

  const connect = useCallback(async () => {
    if (qz.websocket.isActive()) {
      return
    }

    try {
      await qz.websocket.connect()
    } catch (error) {
      console.error(
        'No se pudo conectar con QZ Tray:',
        error,
      )

      throw new Error(
        'No se pudo conectar con QZ Tray. Verifica que esté abierto.',
      )
    }
  }, [])

  const refreshPrinters = useCallback(async () => {
    setIsLoadingPrinters(true)

    try {
      await connect()

      const result = await qz.printers.find()

      const printerList = Array.isArray(result)
        ? result
        : result
          ? [result]
          : []

      setPrinters(printerList)

      setSelectedPrinterState(currentPrinter => {
        if (
          currentPrinter &&
          printerList.includes(currentPrinter)
        ) {
          return currentPrinter
        }

        const savedPrinter =
          localStorage.getItem(
            PRINTER_STORAGE_KEY,
          )

        if (
          savedPrinter &&
          printerList.includes(savedPrinter)
        ) {
          return savedPrinter
        }

        if (printerList.length === 1) {
          const onlyPrinter = printerList[0]

          localStorage.setItem(
            PRINTER_STORAGE_KEY,
            onlyPrinter,
          )

          return onlyPrinter
        }

        return ''
      })
    } catch (error) {
      console.error(
        'No se pudieron obtener las impresoras:',
        error,
      )

      setPrinters([])
    } finally {
      setIsLoadingPrinters(false)
    }
  }, [connect])

  const setSelectedPrinter = useCallback(
    (printerName: string) => {
      setSelectedPrinterState(printerName)

      if (printerName) {
        localStorage.setItem(
          PRINTER_STORAGE_KEY,
          printerName,
        )
      } else {
        localStorage.removeItem(
          PRINTER_STORAGE_KEY,
        )
      }
    },
    [],
  )

  const print = useCallback(
    async (ticketText: string) => {
      if (!ticketText.trim()) {
        throw new Error(
          'El ticket no contiene información para imprimir.',
        )
      }

      if (!selectedPrinter) {
        throw new Error(
          'Selecciona una impresora antes de cobrar.',
        )
      }

      await connect()

      const config = qz.configs.create(
        selectedPrinter,
        {
          encoding: 'UTF-8',
        },
      )

      await qz.print(config, [
        {
          type: 'raw',
          format: 'plain',
          data: ticketText,
        },
      ])
    },
    [connect, selectedPrinter],
  )

  useEffect(() => {
    void refreshPrinters()
  }, [refreshPrinters])

  return {
    print,
    printers,
    selectedPrinter,
    setSelectedPrinter,
    isLoadingPrinters,
    refreshPrinters,
  }
}