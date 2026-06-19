import { useQuery } from '@tanstack/react-query'
import { cashRegistersApi } from '../api/cashRegisters'

export function useCashRegister() {
  const { data: current, isLoading } = useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn: () => cashRegistersApi.getCurrent().then(r => r.data.data ?? null),
  })

  const { data: movements = [] } = useQuery({
    queryKey: ['cash-movements', current?.id],
    queryFn: () =>
      current
        ? cashRegistersApi.getMovements(current.id).then(r => r.data.data ?? [])
        : Promise.resolve([]),
    enabled: !!current,
  })

  return {
    current,
    movements,
    isLoading,
  }
}