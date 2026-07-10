import qz from 'qz-tray'

let connectionPromise: Promise<void> | null = null

type QzCertificateResolver = (certificate: string) => void
type QzSignatureResolver = (signature: string) => void

qz.security.setCertificatePromise(
  (resolve: QzCertificateResolver): void => {
    resolve('')
  },
)

qz.security.setSignatureAlgorithm('SHA512')

qz.security.setSignaturePromise(() => {
  return (resolve: QzSignatureResolver): void => {
    resolve('')
  }
})

export async function connectQz(): Promise<void> {
  if (qz.websocket.isActive()) {
    return
  }

  if (!connectionPromise) {
    connectionPromise = qz.websocket
      .connect({
        retries: 3,
        delay: 1,
      })
      .then((): void => undefined)
      .finally((): void => {
        connectionPromise = null
      })
  }

  await connectionPromise
}

export async function getDefaultPrinter(): Promise<string> {
  await connectQz()

  const result = await qz.printers.find()

  const printers: string[] = Array.isArray(result)
    ? result
    : result
      ? [result]
      : []

  if (printers.length === 0) {
    throw new Error('No se encontraron impresoras instaladas.')
  }

  const thermalPrinter = printers.find((printer: string): boolean => {
    const name = printer.toLowerCase()

    return (
      name.includes('pos') ||
      name.includes('thermal') ||
      name.includes('receipt') ||
      name.includes('ticket') ||
      name.includes('80') ||
      name.includes('58')
    )
  })

  return thermalPrinter ?? printers[0]
}

export async function printTicket(
  printerName: string,
  ticketData: string[],
): Promise<void> {
  await connectQz()

  const config = qz.configs.create(printerName, {
    encoding: 'UTF-8',
    copies: 1,
    jobName: 'Ticket de venta',
  })

  await qz.print(config, ticketData)
}

export async function disconnectQz(): Promise<void> {
  if (qz.websocket.isActive()) {
    await qz.websocket.disconnect()
  }
}