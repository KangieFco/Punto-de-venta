import type { Layaway } from '../../../api/layaways'

export type LayawayTicketType =
  | 'layaway'
  | 'layaway-completed'

export type LayawayPaymentInfo = {
  paymentMethod: number

  /*
   * Cantidad capturada:
   * MXN para efectivo/tarjeta,
   * USD para dólares.
   */
  receivedAmount: number

  /*
   * Equivalente recibido en pesos.
   */
  receivedInMxn: number

  /*
   * Cantidad realmente aplicada al apartado.
   */
  appliedAmount: number

  exchangeRate?: number
  changeInMxn: number
  changeInUsd?: number
}

const WIDTH = 32
const TIME_ZONE = 'America/Chihuahua'

const PAYMENT_METHOD = {
  CASH: 1,
  CARD: 2,
  DOLLAR: 4,
} as const

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
  value: string,
  width = WIDTH,
): string {
  const text =
    removeAccents(value)

  if (text.length >= width) {
    return text.slice(0, width)
  }

  const padding =
    Math.floor(
      (width - text.length) /
        2,
    )

  return text
    .padStart(
      text.length + padding,
    )
    .padEnd(width)
}

function line(
  character = '-',
): string {
  return character.repeat(WIDTH)
}

function columnLine(
  left: string,
  right: string,
): string {
  const cleanLeft =
    removeAccents(left)

  const cleanRight =
    removeAccents(right)

  const available =
    WIDTH -
    cleanRight.length -
    1

  const fittedLeft =
    cleanLeft.length > available
      ? cleanLeft.slice(
          0,
          available,
        )
      : cleanLeft

  const spaces = Math.max(
    1,
    WIDTH -
      fittedLeft.length -
      cleanRight.length,
  )

  return (
    fittedLeft +
    ' '.repeat(spaces) +
    cleanRight
  )
}

function money(
  value: number,
): string {
  return `$${(
    Number(value) || 0
  ).toFixed(2)}`
}

function formatDateTime(
  value: string,
): string {
  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: TIME_ZONE,
    },
  ).format(date)
}

function formatDate(
  value: string,
): string {
  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: TIME_ZONE,
    },
  ).format(date)
}

function getPaymentMethod(
  layaway: Layaway,
): string {
  const methods = [
    ...new Set(
      layaway.payments
        .map(payment =>
          payment.paymentMethod.trim(),
        )
        .filter(Boolean),
    ),
  ]

  if (methods.length === 0) {
    return 'No especificado'
  }

  if (methods.length > 1) {
    return 'Mixto'
  }

  const method = methods[0]

  switch (method) {
    case 'Cash':
      return 'Efectivo'

    case 'Card':
      return 'Tarjeta'

    case 'Dollar':
      return 'Dolares USD'

    default:
      return method
  }
}

function paymentMethodLabel(
  paymentMethod: number,
): string {
  switch (paymentMethod) {
    case PAYMENT_METHOD.CASH:
      return 'Efectivo'

    case PAYMENT_METHOD.CARD:
      return 'Tarjeta'

    case PAYMENT_METHOD.DOLLAR:
      return 'Dolares USD'

    default:
      return 'Otro'
  }
}

export function buildLayawayTicketText(
  layaway: Layaway,
  type: LayawayTicketType,
  paymentInfo?: LayawayPaymentInfo,
): string {
  const completed =
    type ===
    'layaway-completed'

  const rows: string[] = []

  rows.push(
    center('Mineros de Parral'),
  )

  rows.push(line('-'))

  rows.push(
    center(
      completed
        ? 'APARTADO LIQUIDADO'
        : 'COMPROBANTE DE APARTADO',
    ),
  )

  rows.push(line('-'))

  rows.push(
    `Folio  : ${removeAccents(
      layaway.folio,
    )}`,
  )

  if (
    completed &&
    layaway.saleFolio
  ) {
    rows.push(
      `Venta  : ${removeAccents(
        layaway.saleFolio,
      )}`,
    )
  }

  rows.push(
    `Fecha  : ${formatDateTime(
      completed &&
        layaway.completedAt
        ? layaway.completedAt
        : layaway.createdAt,
    )}`,
  )

  rows.push(
    `Cajero : ${removeAccents(
      layaway.userFullName,
    )}`,
  )

  rows.push(
    `Cliente: ${removeAccents(
      layaway.clientName,
    )}`,
  )

  if (layaway.clientPhone) {
    rows.push(
      `Tel.   : ${removeAccents(
        layaway.clientPhone,
      )}`,
    )
  }

  if (!completed) {
    rows.push(
      `Vence  : ${formatDate(
        layaway.expiresAt,
      )}`,
    )
  }

  rows.push(line('-'))

  rows.push(
    columnLine(
      'PRODUCTO',
      'IMPORTE',
    ),
  )

  rows.push(line('-'))

  layaway.details.forEach(
    detail => {
      const name =
        removeAccents(
          detail.productName,
        )

      rows.push(
        name.length > WIDTH
          ? name.slice(
              0,
              WIDTH,
            )
          : name,
      )

      rows.push(
        columnLine(
          `  ${detail.quantity} x ${money(
            detail.unitPrice,
          )}`,
          money(
            detail.subtotal,
          ),
        ),
      )
    },
  )

  rows.push(line('-'))

  rows.push(
    columnLine(
      'TOTAL:',
      money(layaway.total),
    ),
  )

  rows.push(
    columnLine(
      'Pago:',
      paymentInfo
        ? paymentMethodLabel(
            paymentInfo.paymentMethod,
          )
        : getPaymentMethod(
            layaway,
          ),
    ),
  )

  rows.push(
    columnLine(
      completed
        ? 'Pagado total:'
        : 'Anticipo:',
      money(
        layaway.deposit,
      ),
    ),
  )

  rows.push(
    columnLine(
      'Restante:',
      money(
        layaway.remaining,
      ),
    ),
  )

  /*
   * Detalle específico del último pago.
   */
  if (paymentInfo) {
    rows.push(line('-'))

    if (
      paymentInfo.paymentMethod ===
      PAYMENT_METHOD.DOLLAR
    ) {
      rows.push(
        columnLine(
          'Recibido USD:',
          `$${paymentInfo.receivedAmount.toFixed(
            2,
          )}`,
        ),
      )

      if (
        paymentInfo.exchangeRate
      ) {
        rows.push(
          columnLine(
            'Tipo cambio:',
            `$${paymentInfo.exchangeRate.toFixed(
              2,
            )}`,
          ),
        )
      }

      rows.push(
        columnLine(
          'Equiv. MXN:',
          money(
            paymentInfo.receivedInMxn,
          ),
        ),
      )
    } else {
      rows.push(
        columnLine(
          'Recibido:',
          money(
            paymentInfo.receivedAmount,
          ),
        ),
      )
    }

    rows.push(
      columnLine(
        'Aplicado:',
        money(
          paymentInfo.appliedAmount,
        ),
      ),
    )

    if (
      paymentInfo.changeInMxn >
      0
    ) {
      rows.push(
        columnLine(
          'Cambio MXN:',
          money(
            paymentInfo.changeInMxn,
          ),
        ),
      )

      if (
        paymentInfo.changeInUsd !==
          undefined &&
        paymentInfo.changeInUsd >
          0
      ) {
        rows.push(
          columnLine(
            'Cambio USD:',
            `$${paymentInfo.changeInUsd.toFixed(
              2,
            )}`,
          ),
        )
      }
    }
  }

  rows.push(
    columnLine(
      'Estado:',
      completed
        ? 'LIQUIDADO'
        : 'PENDIENTE',
    ),
  )

  rows.push(line('='))

  if (completed) {
    rows.push(
      center(
        '!Gracias por su compra!',
      ),
    )

    rows.push(
      center(
        'Mineros de Parral Producto Oficial',
      ),
    )
  } else {
    rows.push(
      center(
        'Conserve este comprobante',
      ),
    )
  }

  rows.push('')
  rows.push('')
  rows.push('')

  return rows.join('\n')
}