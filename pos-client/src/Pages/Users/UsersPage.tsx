import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../../api/client'
import type { ApiResponse } from '../../types/api'
import Badge from '../../components/ui/Badge'
import UserForm from './UserForm'

export interface UserDto {
  id:        number
  fullName:  string
  username:  string
  roleId:    number
  roleName:  string
  active:    boolean
  createdAt: string
}

const usersApi = {
  getAll:     () =>
    client.get<ApiResponse<UserDto[]>>('/users'),
  activate:   (id: number) =>
    client.patch(`/users/${id}/activate`),
  deactivate: (id: number) =>
    client.patch(`/users/${id}/deactivate`),
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [editing, setEditing] =
    useState<UserDto | null | undefined>(undefined)

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn:  () => usersApi.getAll().then(r => r.data.data ?? []),
  })

  const toggleMutation = useMutation({
    mutationFn: (u: UserDto) =>
      u.active ? usersApi.deactivate(u.id) : usersApi.activate(u.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario actualizado')
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? 'Error'),
  })

  const roleVariant = (role: string) =>
    ({ Admin: 'blue', Cajero: 'green',
       Inventario: 'yellow', Supervisor: 'gray' }
      [role] ?? 'gray') as 'blue'|'green'|'yellow'|'gray'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.length ?? 0} usuarios registrados
          </p>
        </div>
        <button
          onClick={() => setEditing(null)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Nuevo usuario
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-8 py-6 font-medium text-gray-600">
                Nombre
              </th>
              <th className="text-left px-8 py-6 font-medium text-gray-600">
                Usuario
              </th>
              <th className="text-left px-8 py-6 font-medium text-gray-600">
                Rol
              </th>
              <th className="text-left px-8 py-6 font-medium text-gray-600">
                Estado
              </th>
              <th className="text-left px-8 py-6 font-medium text-gray-600">
                Creado
              </th>
              <th className="px-8 py-6" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  Cargando...
                </td>
              </tr>
            ) : data?.map(u => (
              <tr key={u.id} className="hover:bg-black-50">
                <td className="px-8 py-6 font-medium text-black-900">
                  {u.fullName}
                </td>
                <td className="px-8 py-6 font-mono text-black-600">
                  @{u.username}
                </td>
                <td className="px-8 py-6">
                  <Badge label={u.roleName} variant={roleVariant(u.roleName)} />
                </td>
                <td className="px-8 py-6">
                  <Badge
                    label={u.active ? 'Activo' : 'Inactivo'}
                    variant={u.active ? 'green' : 'red'}
                  />
                </td>
                <td className="px-8 py-6 text-black-500">
                  {new Date(u.createdAt).toLocaleDateString('es-MX')}
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setEditing(u)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Pencil size={24} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate(u)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      {u.active
                        ? <ToggleRight size={24} className="text-green-600" />
                        : <ToggleLeft  size={24} className="text-gray-400" />
                      }
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <UserForm
          user={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  )
}