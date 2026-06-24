declare global {
  interface Window { qz: any }
}

export const loadQzScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (window.qz) { resolve(); return }
    const script    = document.createElement('script')
    script.src      = 'https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js'
    script.onload   = () => resolve()
    script.onerror  = () => reject(new Error('No se pudo cargar QZ Tray'))
    document.head.appendChild(script)
  })

// Conectar con QZ Tray (debe estar corriendo en la máquina)
export const connectQz = async (): Promise<void> => {
  await loadQzScript()
  if (!window.qz.websocket.isActive()) {
    await window.qz.websocket.connect()
  }
}

// Desconectar
export const disconnectQz = async (): Promise<void> => {
  if (window.qz?.websocket?.isActive()) {
    await window.qz.websocket.disconnect()
  }
}

// Obtener impresoras disponibles
export const getPrinters = async (): Promise<string[]> => {
  await connectQz()
  return await window.qz.printers.find()
}

// Imprimir ticket en texto plano ESC/POS
export const printTicket = async (
  printerName: string,
  ticketText:  string
): Promise<void> => {
  await connectQz()

  const config = window.qz.configs.create(printerName, {
    size:        { width: 58 },  // 58mm — cambia a 80 si tu impresora es de 80mm
    units:       'mm',
    scaleContent: false,
  })

  // Convertir texto plano a comandos ESC/POS
  const data = [
    { type: 'raw', format: 'plain', data: ticketText }
  ]

  await window.qz.print(config, data)
}

// Imprimir con ESC/POS directo (más control)
export const printEscPos = async (
  printerName: string,
  lines:       string[]
): Promise<void> => {
  await connectQz()

  const ESC  = '\x1B'
  const GS   = '\x1D'
  const INIT = `${ESC}@`           // Inicializar
  const CUT        = `${GS}V\x42\x00` // Corte de papel

  const config = window.qz.configs.create(printerName)

  const data = [
    { type: 'raw', format: 'plain', data: INIT },
    ...lines.map(line => ({
      type: 'raw', format: 'plain', data: line + '\n'
    })),
    { type: 'raw', format: 'plain', data: '\n\n\n' },
    { type: 'raw', format: 'plain', data: CUT },
  ]

  await window.qz.print(config, data)
}