export const statusVariant = (s: string) =>
  ({
    Pending: 'yellow',
    Completed: 'green',
    Cancelled: 'red',
    Expired: 'red',
  }[s] ?? 'red') as 'yellow' | 'green' | 'red'

export const statusLabel = (s: string) =>
  ({
    Pending: 'Pendiente',
    Completed: 'Completado',
    Cancelled: 'Cancelado',
    Expired: 'Vencido',
  }[s] ?? s)

export const paymentLabel = (method: string) =>
  ({
    Cash: '💵 Efectivo',
    Card: '💳 Tarjeta',
    Dollar: '🇺🇸 Dólares',
  }[method] ?? method)

export const statusText = (status: string) =>
  ({
    Pending: '🕐 Pendiente',
    Completed: '✅ Completado',
    Cancelled: '❌ Cancelado',
    Expired: '⛔ Vencido',
  }[status] ?? status)