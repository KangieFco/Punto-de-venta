import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import client from '../../api/client'
import type { ApiResponse } from '../../types/api'
import type { UserDto } from './UsersPage'

interface Role { id: number; name: string }

interface UserFormData {
  fullName: string
  username: string
  password: string
  roleId:   number
}

interface Props {
  user:    UserDto | null
  onClose: () => void
}

export default function UserForm({ user, onClose }: Props) {
  const qc     = useQueryClient()
  const isEdit = !!user

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn:  () =>
      client.get<ApiResponse<Role[]>>('/roles').then(r => r.data.data ?? []),
  })

  const { register, handleSubmit, formState: { errors } } =
    useForm<UserFormData>({
      defaultValues: {
        fullName: user?.fullName ?? '',
        username: user?.username ?? '',
        password: '',
        roleId:   user?.roleId   ?? 0,
      }
    })

  const mutation = useMutation({
    mutationFn: (data: UserFormData) =>
      isEdit
        ? client.put(`/users/${user!.id}`, data)
        : client.post('/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success(isEdit ? 'Usuario actualizado' : 'Usuario creado')
      onClose()
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? 'Error al guardar'),
  })

  return (
    <Modal
      title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(d => mutation.mutate(d))}
            className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black-700 mb-1">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            {...register('fullName', { required: 'Requerido' })}
            className="input"
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-black-700 mb-1">
            Usuario <span className="text-red-500">*</span>
          </label>
          <input
            {...register('username', { required: 'Requerido' })}
            className="input" 
          />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-black-700 mb-1">
            Contraseña {isEdit && (
              <span className="text-gray-400 font-normal">
                (vacío = no cambiar)
              </span>
            )}
            {!isEdit && <span className="text-red-500"> *</span>}
          </label>
          <input
            {...register('password', {
              required: !isEdit && 'Requerido',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' }
            })}
            type="password" className="input" placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-black-700 mb-1">
            Rol <span className="text-red-500">*</span>
          </label>
          <select
            {...register('roleId', {
              required: 'Requerido',
              valueAsNumber: true
            })}
            className="input"
          >
            <option value="">Seleccionar rol...</option>
            {roles?.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {errors.roleId && (
            <p className="text-red-500 text-sm mt-1">
              {errors.roleId.message}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}