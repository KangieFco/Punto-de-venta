import { useCallback, useEffect, useState } from 'react'
import qz from 'qz-tray'
import { connectQz } from '../utils/qzTray'

const PRINTER_STORAGE_KEY =
  'pos-selected-printer'

export function usePrinter() {
  const [printers, setPrinters] =
    useState<string[]>([])

  const [
    selectedPrinter,
    setSelectedPrinterState,
  ] = useState<string>(() => {
    return (
      localStorage.getItem(
        PRINTER_STORAGE_KEY,
      ) ?? ''
    )
  })

  const [
    isLoadingPrinters,
    setIsLoadingPrinters,
  ] = useState(false)

  const refreshPrinters =
    useCallback(async (): Promise<void> => {
      setIsLoadingPrinters(true)

      try {
        await connectQz()

        const result =
          await qz.printers.find()

        const printerList: string[] =
          Array.isArray(result)
            ? result
            : result
              ? [result]
              : []

        setPrinters(printerList)

        setSelectedPrinterState(
          currentPrinter => {
            if (
              currentPrinter &&
              printerList.includes(
                currentPrinter,
              )
            ) {
              return currentPrinter
            }

            const savedPrinter =
              localStorage.getItem(
                PRINTER_STORAGE_KEY,
              )

            if (
              savedPrinter &&
              printerList.includes(
                savedPrinter,
              )
            ) {
              return savedPrinter
            }

            if (
              printerList.length === 1
            ) {
              const onlyPrinter =
                printerList[0]

              localStorage.setItem(
                PRINTER_STORAGE_KEY,
                onlyPrinter,
              )

              return onlyPrinter
            }

            return ''
          },
        )
      } catch (error) {
        console.error(
          'No se pudieron obtener las impresoras:',
          error,
        )

        setPrinters([])
      } finally {
        setIsLoadingPrinters(false)
      }
    }, [])

  const setSelectedPrinter =
    useCallback(
      (printerName: string): void => {
        setSelectedPrinterState(
          printerName,
        )

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
    async (
      ticketText: string,
    ): Promise<void> => {
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

      await connectQz()

      const config = qz.configs.create(
        selectedPrinter,
        {
          encoding: 'CP850',
          copies: 1,
          jobName: 'Ticket de venta',
        },
      )

      /*
       * Agrega avance suficiente para que
       * el mensaje final quede fuera del
       * borde del cortador.
       *
       * GS V 0 intenta realizar corte
       * completo en impresoras compatibles.
       */
      const printableTicket =
        ticketText +
        '\n\n\n\n\n\n' +
        '\x1D\x56\x00'

      await qz.print(config, [
        {
          type: 'raw',
          format: 'plain',
          data: printableTicket,
        },
      ])
    },
    [selectedPrinter],
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