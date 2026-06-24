const TIME_ZONE = 'America/Chihuahua'

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('es-MX', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

export function getLocalDateKey(date: string | Date) {
  return new Date(date).toLocaleDateString('en-CA', {
    timeZone: TIME_ZONE,
  })
}