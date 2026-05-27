import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { cashRegistersApi } from '../../api/cashRegisters'
import { productsApi }       from '../../api/products'
import { useCartStore }      from '../../store/cartStore'
import Cart        from './Cart'
import PaymentModal from './PaymentModal'
import { ShoppingCart, Barcode } from 'lucide-react'

export default function POSPage() {
  const barcodeRef  = useRef<HTMLInputElement>(null)
  const [barcode, setBarcode]       = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const { items, addItem } = useCartStore()

  // Verificar caja abierta
  const { data: cashRegister } = useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn:  () => cashRegistersApi.getCurrent().then(r => r.data.data ?? null),
  })

  // Mantener foco en el input de código de barras
  useEffect(() => {
    const keepFocus = () => barcodeRef.current?.focus()
    keepFocus()
    document.addEventListener('click', keepFocus)
    return () => document.removeEventListener('click', keepFocus)
  }, [])

  const handleBarcode = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const code = barcode.trim()
    if (!code) return
    setBarcode('')

    try {
      const res = await productsApi.getByBarcode(code)
      const product = res.data.data!
      addItem(product)
      toast.success(`${product.name} agregado`, { duration: 1500 })
    } catch {
      // Intentar por código interno
      try {
        const res = await productsApi.search(code)
        const found = res.data.data
        if (found && found.length === 1) {
          addItem(found[0])
          toast.success(`${found[0].name} agregado`, { duration: 1500 })
        } else {
          toast.error(`Producto "${code}" no encontrado`)
        }
      } catch {
        toast.error(`Producto "${code}" no encontrado`)
      }
    }
  }

  if (!cashRegister) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700">Caja cerrada</h2>
          <p className="text-gray-500 mt-2">
            Ve a <strong>Caja</strong> y abre una caja para comenzar a vender.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Columna izquierda — input y búsqueda */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Barra superior */}
        <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-lg">
            <Barcode
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={barcodeRef}
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              onKeyDown={handleBarcode}
              className="input pl-10 text-base font-mono"
              placeholder="Escanea o escribe código de barras..."
              autoComplete="off"
            />
          </div>
          <div className="text-sm text-gray-500">
            Caja #{cashRegister.id} — {cashRegister.userFullName}
          </div>
        </div>

        {/* Área central — vacío o instrucciones */}
        <div className="flex-1 flex items-center justify-center">
          {items.length === 0 ? (
            <div className="text-center text-gray-400">
              <Barcode size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">Escanea un producto para comenzar</p>
              <p className="text-sm mt-1">
                El cursor siempre está listo para el lector
              </p>
            </div>
          ) : (
            <p className="text-gray-400">
              {items.length} producto(s) en el carrito →
            </p>
          )}
        </div>
      </div>

      {/* Columna derecha — carrito */}
      <Cart onCheckout={() => setShowPayment(true)} />

      {/* Modal de cobro */}
      {showPayment && (
        <PaymentModal
          cashRegisterId={cashRegister.id}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  )
}