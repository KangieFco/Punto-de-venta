import qz from 'qz-tray'
import { connectQz } from '../../../utils/qzTray'

export type TicketType =
  | 'layaway'
  | 'layaway-completed'

export type TicketItem = {
  quantity: number
  name: string
  unitPrice: number
  total: number
}

export type TicketData = {
  type: TicketType

  folio: string
  saleFolio?: string

  date: string
  cashier: string

  clientName?: string
  clientPhone?: string | null
  expiresAt?: string

  items: TicketItem[]

  subtotal: number
  total: number

  paymentMethod: string

  paid?: number
  remaining?: number

  status?: string
}

const DEFAULT_PRINTER_KEY =
  'pos-printer-name'

const TICKET_WIDTH = 32

const STORE_NAME =
  'Mineros de Parral Oficial'

const STORE_ADDRESS = ''
const STORE_PHONE = ''

function money(value: number): string {
  const safeValue =
    Number(value) || 0

  return `$${safeValue.toFixed(2)}`
}

function removeAccents(
  value: string,
): string {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
}

function center(
  text: string,
  width = TICKET_WIDTH,
): string {
  const cleanText =
    removeAccents(text)

  if (cleanText.length >= width) {
    return cleanText.slice(0, width)
  }

  const totalPadding =
    width - cleanText.length

  const leftPadding =
    Math.floor(totalPadding / 2)

  const rightPadding =
    totalPadding - leftPadding

  return (
    ' '.repeat(leftPadding) +
    cleanText +
    ' '.repeat(rightPadding)
  )
}

function separator(
  character = '-',
): string {
  return `${character.repeat(
    TICKET_WIDTH,
  )}\n`
}

function columnLine(
  left: string,
  right: string,
  width = TICKET_WIDTH,
): string {
  const cleanLeft =
    removeAccents(left)

  const cleanRight =
    removeAccents(right)

  const minimumSpaces = 1

  const availableLeft = Math.max(
    0,
    width -
      cleanRight.length -
      minimumSpaces,
  )

  const fittedLeft =
    cleanLeft.length >
    availableLeft
      ? cleanLeft.slice(
          0,
          availableLeft,
        )
      : cleanLeft

  const spaces = Math.max(
    minimumSpaces,
    width -
      fittedLeft.length -
      cleanRight.length,
  )

  return (
    fittedLeft +
    ' '.repeat(spaces) +
    cleanRight +
    '\n'
  )
}

function truncate(
  value: string,
  maxLength: number,
): string {
  const cleanValue =
    removeAccents(value)

  return cleanValue.length >
    maxLength
    ? cleanValue.slice(
        0,
        maxLength,
      )
    : cleanValue
}

function ticketTitle(
  type: TicketType,
): string {
  if (
    type ===
    'layaway-completed'
  ) {
    return 'APARTADO LIQUIDADO'
  }

  return 'COMPROBANTE DE APARTADO'
}

export async function getPrinters(): Promise<
  string[]
> {
  await connectQz()

  const printers =
    await qz.printers.find()

  return Array.isArray(printers)
    ? printers
    : [printers]
}

export function savePrinter(
  printerName: string,
): void {
  localStorage.setItem(
    DEFAULT_PRINTER_KEY,
    printerName,
  )
}

export function getSavedPrinter():
  | string
  | null {
  return localStorage.getItem(
    DEFAULT_PRINTER_KEY,
  )
}

export async function findPrinter(
  printerName?: string,
): Promise<string> {
  await connectQz()

  const selectedPrinter =
    printerName ??
    getSavedPrinter()

  if (selectedPrinter) {
    try {
      return await qz.printers.find(
        selectedPrinter,
      )
    } catch {
      localStorage.removeItem(
        DEFAULT_PRINTER_KEY,
      )
    }
  }

  const printers =
    await getPrinters()

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

function buildStoreHeader(): string[] {
  const commands: string[] = []

  commands.push('\x1B\x61\x01')

  commands.push(
    `${center(STORE_NAME)}\n`,
  )

  if (
    STORE_ADDRESS.trim()
      .length > 0
  ) {
    commands.push(
      `${center(
        STORE_ADDRESS,
      )}\n`,
    )
  }

  if (
    STORE_PHONE.trim()
      .length > 0
  ) {
    commands.push(
      `${center(
        STORE_PHONE,
      )}\n`,
    )
  }

  commands.push(separator())

  return commands
}

function buildTicket(
  ticket: TicketData,
): string[] {
  const commands: string[] = []

  /*
   * Inicializar impresora ESC/POS.
   */
  commands.push('\x1B\x40')

  /*
   * Encabezado.
   */
  commands.push(
    ...buildStoreHeader(),
  )

  /*
   * Título del comprobante.
   */
  commands.push('\x1B\x61\x01')
  commands.push('\x1B\x45\x01')

  commands.push(
    `${center(
      ticketTitle(
        ticket.type,
      ),
    )}\n`,
  )

  commands.push('\x1B\x45\x00')
  commands.push(separator())

  /*
   * Alinear contenido a la izquierda.
   */
  commands.push('\x1B\x61\x00')

  commands.push(
    `Folio  : ${removeAccents(
      ticket.folio,
    )}\n`,
  )

  if (ticket.saleFolio) {
    commands.push(
      `Venta  : ${removeAccents(
        ticket.saleFolio,
      )}\n`,
    )
  }

  commands.push(
    `Fecha  : ${removeAccents(
      ticket.date,
    )}\n`,
  )

  commands.push(
    `Cajero : ${removeAccents(
      ticket.cashier,
    )}\n`,
  )

  if (ticket.clientName) {
    commands.push(
      `Cliente: ${removeAccents(
        ticket.clientName,
      )}\n`,
    )
  }

  if (ticket.clientPhone) {
    commands.push(
      `Tel.   : ${removeAccents(
        ticket.clientPhone,
      )}\n`,
    )
  }

  if (ticket.expiresAt) {
    commands.push(
      `Vence  : ${removeAccents(
        ticket.expiresAt,
      )}\n`,
    )
  }

  commands.push(separator())

  /*
   * Productos.
   */
  commands.push(
    columnLine(
      'PRODUCTO',
      'IMPORTE',
    ),
  )

  commands.push(separator())

  ticket.items.forEach(
    item => {
      const quantity =
        Number(
          item.quantity,
        ) || 0

      const unitPrice =
        Number(
          item.unitPrice,
        ) || 0

      const itemTotal =
        Number(
          item.total,
        ) || 0

      const productName =
        truncate(
          item.name,
          TICKET_WIDTH,
        )

      const quantityLine =
        `  ${quantity} x ${money(
          unitPrice,
        )}`

      commands.push(
        `${productName}\n`,
      )

      commands.push(
        columnLine(
          quantityLine,
          money(itemTotal),
        ),
      )
    },
  )

  commands.push(separator())

  /*
   * Total.
   */
  commands.push('\x1B\x45\x01')

  commands.push(
    columnLine(
      'TOTAL:',
      money(ticket.total),
    ),
  )

  commands.push('\x1B\x45\x00')

  /*
   * Método de pago.
   */
  commands.push(
    columnLine(
      'Pago:',
      removeAccents(
        ticket.paymentMethod,
      ),
    ),
  )

  /*
   * Datos del apartado.
   */
  if (
    ticket.paid !== undefined
  ) {
    const paidLabel =
      ticket.type === 'layaway'
        ? 'Anticipo:'
        : 'Pagado:'

    commands.push(
      columnLine(
        paidLabel,
        money(ticket.paid),
      ),
    )
  }

  if (
    ticket.remaining !==
    undefined
  ) {
    commands.push(
      columnLine(
        'Restante:',
        money(
          ticket.remaining,
        ),
      ),
    )
  }

  if (ticket.status) {
    commands.push(
      columnLine(
        'Estado:',
        removeAccents(
          ticket.status,
        ),
      ),
    )
  }

  commands.push(
    separator('='),
  )

  /*
   * Pie.
   */
  commands.push('\x1B\x61\x01')

  if (
    ticket.type ===
    'layaway-completed'
  ) {
    commands.push('\x1B\x45\x01')
    commands.push('\x1B\x45\x00')
    commands.push('\n')

    commands.push(
      `${center(
        'MINEROS DE PARRAL',
      )}\n`,
    )

    commands.push(
      `${center(
        'PRODUCTO OFICIAL',
      )}\n`,
    )

    commands.push(
      `${center(
        'Gracias por su compra!',
      )}\n`,
    )
  } else {
    commands.push(
      `${center(
        'Conserve este comprobante',
      )}\n`,
    )

  }
  commands.push('\n\n\n')
  commands.push('\x1D\x56\x00')

  return commands
}

export async function printTicket(
  ticket: TicketData,
  printerName?: string,
): Promise<void> {
  try {
    const printer =
      await findPrinter(
        printerName,
      )

    const config =
      qz.configs.create(
        printer,
        {
          encoding: 'CP850',
          copies: 1,
          forceRaw: true,
        },
      )

    await qz.print(
      config,
      buildTicket(ticket),
    )
  } catch (error) {
    console.error(
      'Error al imprimir ticket:',
      error,
    )

    if (
      error instanceof Error
    ) {
      throw error
    }

    throw new Error(
      'No se pudo imprimir el ticket',
    )
  }
}