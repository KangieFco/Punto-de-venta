import { useCartStore } from '../../store/cartStore'
import { Package, Trash2, Plus, Minus } from 'lucide-react'
import type { CartItem } from '../../store/cartStore'

export default function ProductFeed() {
  const { items, removeItem, updateQty } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-300 select-none">
        <Package size={90} strokeWidth={0.8} className="mb-4 opacity-40" />
        <p className="text-lg font-medium text-gray-500">Esperando productos...</p>
        <p className="text-sm text-gray-400 mt-1">
          Escanea un código de barras para comenzar
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 h-0 overflow-y-auto bg-gray-50">
      <div className="p-4 space-y-3 w-full">
        {[...items].reverse().map((item, idx) => (
          <ProductFeedCard
            key={item.product.id}
            item={item}
            isLatest={idx === 0}
            onRemove={() => removeItem(item.product.id)}
            onQty={(q) => updateQty(item.product.id, q)}
          />
        ))}
      </div>
    </div>
  )
}

function ProductFeedCard({ item, isLatest, onRemove, onQty }: {
  item: CartItem
  isLatest: boolean
  onRemove: () => void
  onQty: (q: number) => void
}) {
  const { product, quantity, subtotal, discount} = item
  const handleQtyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/\D/g, '')) || 1
    onQty(val)
  }

  return (
    <div className={`bg-white rounded-2xl border flex items-center gap-4 px-5 py-4 transition-all duration-200 ${isLatest ? 'border-primary-400 ring-2 ring-primary-100 shadow-lg' : 'border-gray-200 shadow-sm hover:shadow-md' }`}>

      {/* Imagen del producto */}
      <div className="w-30 h-30 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package size={32} className="text-gray-300" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-lg leading-tight truncate">
              {product.name}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">
              {product.code}
              {product.barcode && (
                <span className="ml-2 font-mono">{product.barcode}</span>
              )}
            </p>
            {discount > 0 && (
              <p className="text-xs text-orange-500 mt-0.5">
                Desc. por pieza: ${discount.toFixed(2)}
              </p>
            )}
          </div>
          {isLatest && (
            <span className="shrink-0 text-xs bg-primary-100 text-primary-700 font-semibold px-2.5 py-1 rounded-full">
              Último
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">

            <button
              onClick={() => onQty(quantity - 1)}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors active:scale-95"
            >
              <Minus size={14} className="text-gray-700" />
            </button>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantity}
              onChange={handleQtyInput}
              onFocus={e => e.target.select()}
              className="w-14 text-center border border-gray-200 rounded-lg py-1.5 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            />

            <button
              onClick={() => onQty(quantity + 1)}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors active:scale-95"
            >
              <Plus size={14} className="text-gray-700" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-gray-900">
              ${subtotal.toFixed(2)}
            </span>
            <button
              onClick={onRemove}
              className="p-2 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}