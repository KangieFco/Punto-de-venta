import qz from 'qz-tray'

export type TicketItem = {
  quantity: number
  name: string
  unitPrice: number
  total: number
}

export type TicketData = {
  folio: string
  date: string
  cashier: string
  items: TicketItem[]
  subtotal: number
  tax?: number
  total: number
  paymentMethod: string
  cashReceived?: number
  change?: number
}

const DEFAULT_PRINTER_KEY = 'pos-printer-name'

function money(value: number): string {
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  })
}

function removeAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function line(
  left: string,
  right: string,
  width = 42,
): string {
  const cleanLeft = removeAccents(left)
  const cleanRight = removeAccents(right)

  const available = Math.max(
    1,
    width - cleanRight.length,
  )

  const fittedLeft =
    cleanLeft.length > available
      ? cleanLeft.slice(0, Math.max(1, available - 1))
      : cleanLeft

  return `${fittedLeft.padEnd(available, ' ')}${cleanRight}\n`
}

export async function connectQz(): Promise<void> {
  if (qz.websocket.isActive()) {
    return
  }

  await qz.websocket.connect({
    retries: 2,
    delay: 1,
  })
}

export async function disconnectQz(): Promise<void> {
  if (qz.websocket.isActive()) {
    await qz.websocket.disconnect()
  }
}

export async function getPrinters(): Promise<string[]> {
  await connectQz()

  const printers = await qz.printers.find()

  return Array.isArray(printers) ? printers : [printers]
}

export function savePrinter(printerName: string): void {
  localStorage.setItem(DEFAULT_PRINTER_KEY, printerName)
}

export function getSavedPrinter(): string | null {
  return localStorage.getItem(DEFAULT_PRINTER_KEY)
}

export async function findPrinter(
  printerName?: string,
): Promise<string> {
  await connectQz()

  const selectedPrinter =
    printerName ?? getSavedPrinter()

  if (selectedPrinter) {
    try {
      return await qz.printers.find(selectedPrinter)
    } catch {
      localStorage.removeItem(DEFAULT_PRINTER_KEY)
    }
  }

  const printers = await getPrinters()

  if (printers.length === 0) {
    throw new Error(
      'No se encontraron impresoras instaladas',
    )
  }

  if (printers.length === 1) {
    savePrinter(printers[0])
    return printers[0]
  }

  throw new Error(
    'Selecciona una impresora antes de imprimir',
  )
}

function buildTicket(ticket: TicketData): string[] {
  const commands: string[] = []

  // Inicializar impresora ESC/POS
  commands.push('\x1B\x40')

  // Centrar
  commands.push('\x1B\x61\x01')

  // Negritas y tamaño doble
  commands.push('\x1B\x45\x01')
  commands.push('\x1D\x21\x11')
  commands.push('MINEROS DE PARRAL\n')

  // Tamaño normal y sin negritas
  commands.push('\x1D\x21\x00')
  commands.push('\x1B\x45\x00')

  commands.push('Sistema de punto de venta\n')
  commands.push('------------------------------------------\n')

  // Alinear a la izquierda
  commands.push('\x1B\x61\x00')

  commands.push(`Folio: ${ticket.folio}\n`)
  commands.push(`Fecha: ${ticket.date}\n`)
  commands.push(`Cajero: ${removeAccents(ticket.cashier)}\n`)
  commands.push('------------------------------------------\n')

  ticket.items.forEach((item) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unitPrice) || 0
    const total = Number(item.total) || 0

    commands.push(
      `${quantity} x ${removeAccents(item.name)}\n`,
    )

    commands.push(
      line(
        `  ${money(unitPrice)}`,
        money(total),
      ),
    )
  })

  commands.push('------------------------------------------\n')
  commands.push(line('Subtotal', money(ticket.subtotal)))

  if (ticket.tax !== undefined && ticket.tax > 0) {
    commands.push(line('IVA', money(ticket.tax)))
  }

  commands.push('\x1B\x45\x01')
  commands.push(line('TOTAL', money(ticket.total)))
  commands.push('\x1B\x45\x00')

  commands.push(
    line('Metodo', removeAccents(ticket.paymentMethod)),
  )

  if (ticket.cashReceived !== undefined) {
    commands.push(
      line('Recibido', money(ticket.cashReceived)),
    )
  }

  if (ticket.change !== undefined) {
    commands.push(
      line('Cambio', money(ticket.change)),
    )
  }

  commands.push('\n')

  // Centrar
  commands.push('\x1B\x61\x01')
  commands.push('Gracias por su compra\n')
  commands.push('Conserve su ticket\n')
  commands.push('\n\n\n')

  // Corte de papel
  commands.push('\x1D\x56\x00')

  return commands
}

export async function printTicket(
  ticket: TicketData,
  printerName?: string,
): Promise<void> {
  try {
    const printer = await findPrinter(printerName)

    const config = qz.configs.create(printer, {
      encoding: 'CP850',
      copies: 1,
    })

    const data = buildTicket(ticket)

    await qz.print(config, data)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }

    throw new Error('No se pudo imprimir el ticket')
  }
}

export async function printTest(
  printerName?: string,
): Promise<void> {
  const printer = await findPrinter(printerName)

  const config = qz.configs.create(printer, {
    encoding: 'CP850',
    copies: 1,
  })

  const data = [
    '\x1B\x40',
    '\x1B\x61\x01',
    '\x1B\x45\x01',
    '\x1D\x21\x11',
    'PRUEBA POS\n',
    '\x1D\x21\x00',
    '\x1B\x45\x00',
    '\n',
    'QZ Tray conectado correctamente\n',
    'Impresora configurada\n',
    '\n\n\n',
    '\x1D\x56\x00',
  ]

  await qz.print(config, data)
}