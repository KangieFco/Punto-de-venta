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
import DiscountModal from '../POS/DiscountModal'

export default function POSPage() {
  const barcodeRef = useRef<HTMLInputElement>(null)
  const [barcode, setBarcode] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const { addItem } = useCartStore()

  const { data: cashRegister } = useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn: () => cashRegistersApi.getCurrent().then(r => r.data.data ?? null),
  })

  useEffect(() => {
    const keepFocus = (e: MouseEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const isInput = ['INPUT','TEXTAREA','SELECT','BUTTON'].includes(tag)
      if (!isInput) barcodeRef.current?.focus()
    }
    barcodeRef.current?.focus()
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
      addItem(res.data.data!)
      toast.success(`✓ ${res.data.data!.name}`, { duration: 1200 })
    } catch {
      try {
        const res   = await productsApi.search(code)
        const found = res.data.data ?? []
        if (found.length === 1) {
          addItem(found[0])
          toast.success(`✓ ${found[0].name}`, { duration: 1200 })
        } else if (found.length > 1) {
          toast.error('Varios productos — sé más específico')
        } else {
          toast.error(`"${code}" no encontrado`)
        }
      } catch {
        toast.error(`"${code}" no encontrado`)
      }
    }
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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm shink-0">
          {/* Input código de barras */}
          <div className="relative flex-1 max-w-lg">
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
          <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border rounded-lg px-3 py-2 whitespace-nowrap">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Caja #{cashRegister.id} — {cashRegister.userFullName}
          </div>
          
          <div className="ml-auto shrink-0">
            <PrinterSelector />
          </div>
        </div>

        <ProductFeed />
      </div>

      <Cart
        onCheckout={() => setShowPayment(true)}
        onDiscount={() => setShowDiscount(true)}
      />

      {/* Modales */}
      {showPayment && (
        <PaymentModal
          cashRegisterId={cashRegister.id}
          onClose={() => setShowPayment(false)}
        />
      )}

      {showDiscount && (
        <DiscountModal onClose={() => setShowDiscount(false)} />
      )}
    </div>
  )
}