export type PaymentBreakdownItem = {
  method: string
  amount: number
}

const paymentLabels: Record<string, string> = {
  Cash: '💵 Efectivo',
  Card: '💳 Tarjeta',
  Dollar: '🇺🇸 Dólares',
  Other: '🔄 Otro',
  Mixed: '🔀 Pago mixto',
}

export function formatPaymentMethod(method: string) {
  return paymentLabels[method] ?? method
}

export function parsePaymentBreakdown(value: any): PaymentBreakdownItem[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.map(p => ({
      method: p.method,
      amount: Number(p.amount) || 0,
    }))
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(part => {
        const [method, amount] = part.split(':')

        return {
          method: method?.trim(),
          amount: Number(amount) || 0,
        }
      })
      .filter(p => p.method && p.amount > 0)
  }

  return []
}