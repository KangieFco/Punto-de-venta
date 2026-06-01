import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Barcode, ShoppingCart } from 'lucide-react'

import { cashRegistersApi } from '../../api/cashRegisters'
import { productsApi } from '../../api/products'
import { useCartStore } from '../../store/cartStore'

import Cart from './Cart'
import PaymentModal from './PaymentModal'
import ProductFeed from './ProductFeed'
import PrinterSelector from '../../components/PrinterSelector'

export default function POSPage() {
  const barcodeRef = useRef<HTMLInputElement>(null)

  const [barcode, setBarcode] = useState('')
  const [showPayment, setShowPayment] = useState(false)

  const { items, addItem } = useCartStore()

  const {
    data: cashRegister,
    isLoading,
  } = useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn: () => cashRegistersApi.getCurrent().then(r => r.data.data ?? null),
  })

  useEffect(() => {
    const keepFocus = (e?: MouseEvent) => {
      const target = e?.target as HTMLElement | null
      const tag = target?.tagName

      if (tag && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) {
        return
      }
      barcodeRef.current?.focus()
    }

    keepFocus()
    document.addEventListener('click', keepFocus)
    return () => {
      document.removeEventListener('click', keepFocus)
    }
  }, [])

  const handleBarcode = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return

    const code = barcode.trim()
    if (!code) return
    setBarcode('')

    try {
      const res = await productsApi.getByBarcode(code)
      const product = res.data.data
      if (!product) {
        throw new Error('Producto no encontrado')
      }

      addItem(product)
      toast.success(`✓ ${product.name}`, { duration: 1200 })
    } catch {
      try {
        const res = await productsApi.search(code)
        const found = res.data.data ?? []

        if (found.length === 1) {
          addItem(found[0])
          toast.success(`✓ ${found[0].name}`, { duration: 1200 })
        } else if (found.length > 1) {
          toast.error('Varios productos encontrados, sé más específico')
        } else {
          toast.error(`"${code}" no encontrado`)
        }
      } catch {
        toast.error(`"${code}" no encontrado`)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Verificando caja abierta...</p>
      </div>
    )
  }

  if (!cashRegister) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShoppingCart size={72} className="mx-auto text-gray-200 mb-4" />

          <h2 className="text-xl font-bold text-gray-600">
            Caja cerrada
          </h2>

          <p className="text-gray-400 mt-2 text-sm">
            Ve a <strong>Caja</strong> y abre una caja para comenzar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
          {/* Input código de barras */}
          <div className="relative flex-1 max-w-md">
            <Barcode
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              ref={barcodeRef}
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              onKeyDown={handleBarcode}
              className="input pl-9 font-mono text-sm"
              placeholder="Escanea código de barras o escribe..."
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Info de caja */}
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border rounded-lg px-3 py-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Caja #{cashRegister.id} — {cashRegister.userFullName}
          </div>
          
          <div className="ml-auto">
            <PrinterSelector />
          </div>
        </div>

        {/* Feed de productos escaneados */}
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Barcode size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">Escanea un producto para comenzar</p>
              <p className="text-sm mt-1">
              </p>
            </div>
          </div>
        ) : (
          <ProductFeed />
        )}
      </div>

      {/* Columna derecha — carrito */}
      <Cart onCheckout={() => setShowPayment(true)} />

      {showPayment && (
        <PaymentModal
          cashRegisterId={cashRegister.id}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  )
}