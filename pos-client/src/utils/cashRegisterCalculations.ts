import { type CashMovement } from '../api/cashRegisters'

export function getTotalIn(movements: CashMovement[]) {
  return movements
    .filter(m => m.type === 'In')
    .reduce((sum, m) => sum + m.amount, 0)
}

export function getTotalOut(movements: CashMovement[]) {
  return movements
    .filter(m => m.type === 'Out')
    .reduce((sum, m) => sum + m.amount, 0)
}

export function getExpectedCash(
  openingAmount: number,
  movements: CashMovement[]
) {
  return openingAmount + getTotalIn(movements) - getTotalOut(movements)
}