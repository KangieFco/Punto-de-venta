import Badge from '../../../src/components/ui/Badge'
import { getMovementTypeInfo } from '../../utils/inventoryFormatters'

type InventoryMovement = {
  id: number
  productName: string
  movementType: string
  quantity: number
  previousStock: number
  newStock: number
  reason?: string | null
  reference?: string | null
  userFullName: string
  createdAt: string
}

type Props = {
  movements: InventoryMovement[]
  filteredCount: number
  isLoading: boolean
}

export default function MovementsTable({
  movements,
  filteredCount,
  isLoading,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-4 font-bold text-black">Producto</th>
            <th className="text-left px-4 py-4 font-bold text-black">Tipo</th>
            <th className="text-center px-4 py-4 font-bold text-black">Cantidad</th>
            <th className="text-center px-4 py-4 font-bold text-black">Antes</th>
            <th className="text-center px-4 py-4 font-bold text-black">Después</th>
            <th className="text-left px-4 py-4 font-bold text-black">Motivo</th>
            <th className="text-left px-4 py-4 font-bold text-black">Usuario</th>
            <th className="text-left px-4 py-4 font-bold text-black">Fecha</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={8} className="text-center py-12 text-base text-black">
                Cargando...
              </td>
            </tr>
          ) : filteredCount === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-12 text-base text-black">
                Sin movimientos
              </td>
            </tr>
          ) : (
            movements.map(movement => {
              const { label, variant } = getMovementTypeInfo(movement.movementType)

              return (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-8 py-6 text-gray-700 font-medium"> {movement.productName} </td>
                  <td className="px-4 py-4"> <Badge label={label} variant={variant} /> </td>
                  <td className="px-8 py-6 text-center text-gray-700 font-medium"> {movement.quantity} </td>
                  <td className="px-8 py-6 text-center text-gray-700 font-medium"> {movement.previousStock} </td>
                  <td className="px-8 py-6 text-center text-gray-700 font-medium"> {movement.newStock} </td>
                  <td className="px-8 py-6 text-gray-700 font-medium"> {movement.reason ?? movement.reference ?? '—'} </td>
                  <td className="px-8 py-6 text-gray-700 font-medium"> {movement.userFullName} </td>
                  <td className="px-4 py-4 text-base text-black whitespace-nowrap"> {new Date(movement.createdAt).toLocaleString('es-MX')} </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}