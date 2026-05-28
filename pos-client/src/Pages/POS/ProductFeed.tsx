import { useCartStore } from '../../store/cartStore'
import { Package, Trash2, Plus, Minus } from 'lucide-react'

export default function ProductFeed() {
  const { items, removeItem, updateQty } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center
                      text-gray-300 select-none">
        <Package size={80} strokeWidth={1} className="mb-4" />
        <p className="text-lg font-medium">Esperando productos...</p>
        <p className="text-sm mt-1">
          Escanea un código de barras para comenzar
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Mostramos los más recientes arriba */}
      <div className="space-y-3 max-w-3xl mx-auto">
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

// ── Tarjeta de producto en el feed ────────────────────────────

import type { CartItem } from '../../store/cartStore'

function ProductFeedCard({ item, isLatest, onRemove, onQty }: {
  item:      CartItem
  isLatest:  boolean
  onRemove:  () => void
  onQty:     (q: number) => void
}) {
  const { product, quantity, subtotal } = item

  return (
    <div className={`bg-white rounded-2xl border flex items-center gap-4
                     px-4 py-3 shadow-sm transition-all
                     ${isLatest
                       ? 'border-primary-400 ring-2 ring-primary-100 shadow-md'
                       : 'border-gray-200'
                     }`}>

      {/* Imagen del producto */}
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100
                      flex items-center justify-center shrink-0 border">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package size={28} className="text-gray-300" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate text-base">
              {product.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {product.code}
              {product.barcode && ` · ${product.barcode}`}
            </p>
          </div>
          {isLatest && (
            <span className="shrink-0 text-xs bg-primary-100 text-primary-700
                             font-medium px-2 py-0.5 rounded-full">
              Último
            </span>
          )}
        </div>

        {/* Precio y cantidad */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {/* Botón menos */}
            <button
              onClick={() => onQty(quantity - 1)}
              className="w-7 h-7 rounded-lg border border-gray-200 bg-white
                         hover:bg-gray-50 flex items-center justify-center
                         transition-colors"
            >
              <Minus size={12} className="text-gray-600" />
            </button>

            {/* Cantidad editable */}
            <input
              type="number"
              value={quantity}
              min={1}
              onChange={e => onQty(parseInt(e.target.value) || 1)}
              className="w-12 text-center border border-gray-200 rounded-lg
                         py-1 text-sm font-bold text-gray-900 focus:outline-none
                         focus:ring-2 focus:ring-primary-300"
            />

            {/* Botón más */}
            <button
              onClick={() => onQty(quantity + 1)}
              className="w-7 h-7 rounded-lg border border-gray-200 bg-white
                         hover:bg-gray-50 flex items-center justify-center
                         transition-colors"
            >
              <Plus size={12} className="text-gray-600" />
            </button>

            <span className="text-xs text-gray-400 ml-1">
              × ${product.salePrice.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-900">
              ${subtotal.toFixed(2)}
            </span>
            <button
              onClick={onRemove}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={15} className="text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}