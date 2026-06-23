type BadgeVariant = 'green' | 'red' | 'blue' | 'yellow' | 'gray'

type MovementTypeInfo = {
  label: string
  variant: BadgeVariant
}

const movementTypes: Record<string, MovementTypeInfo> = {
  Entry: { label: 'Entrada', variant: 'green' },
  Output: { label: 'Salida', variant: 'red' },
  SalePending: { label: 'Venta', variant: 'blue' },
  CancellationReturn: { label: 'Devolución', variant: 'yellow' },
  Adjustment: { label: 'Ajuste', variant: 'gray' },
}

export function getMovementTypeInfo(type: string): MovementTypeInfo {
  return movementTypes[type] ?? { label: type, variant: 'gray' }
}