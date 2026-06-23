import { History } from 'lucide-react'
import type { Product } from '../../../api/products'
import Badge from '../../../components/ui/Badge'

type Props = {
  products: Product[]
}

export default function StockTable({ products }: Props) {
  return (
    <div className="card mb-6 overflow-hidden p-0">
      <div className="px-6 py-4 border-b flex items-center gap-2">
        <History size={22} className="text-black" />
        <h2 className="text-xl font-bold text-black">Stock actual</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-4 font-bold text-black">Producto</th>
              <th className="text-left px-4 py-4 font-bold text-black">Categoría</th>
              <th className="text-center px-4 py-4 font-bold text-black">Stock</th>
              <th className="text-center px-4 py-4 font-bold text-black">Mínimo</th>
              <th className="text-left px-4 py-4 font-bold text-black">Estado</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="text-base font-medium text-black"> {product.name} </div>
                  <div className="text-sm font-medium text-black"> {product.code} </div>
                </td>
                <td className="px-4 py-4 text-base font-medium text-black"> {product.categoryName} </td>
                <td className="px-8 py-6 text-center font-medium text-black"> <span className={product.isLowStock ? 'text-red-600' : 'text-black'}> {product.stock} {product.unit} </span> </td>
                <td className="px-4 py-4 text-center text-base font-medium text-black"> {product.minStock} </td>
                <td className="px-4 py-4">
                  <Badge
                    label={product.isLowStock ? 'Bajo stock' : 'OK'}
                    variant={product.isLowStock ? 'red' : 'green'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}