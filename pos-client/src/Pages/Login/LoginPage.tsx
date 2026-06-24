import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import type { LoginRequest } from '../../types/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>()

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true)

    try {
      const res = await authApi.login(data)
      const { token, user } = res.data.data!

      setAuth(token, user)

      toast.success(`Bienvenido, ${user.fullName}`)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-primary-700 to-primary-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 z-0" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="text-6xl"></div>
        </div>
          <img
            src="/KS_BannerBCO.png"
            alt="Logo"
            className="absolute top-5 left-5 z-10 w-[min(350px,40vw)] h-auto object-contain"
          />
        <div className="relative z-10 text-white space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight">
            KangSync System
          </h1>
          <p className="text-primary-100 max-w-md">
            Bienvenido al sistema de punto de venta. Administra ventas,
            productos, inventario, caja  y estadísticas desde un solo lugar.
          </p>
        </div>
        <div className="relative z-10 text-xs text-primary-200">
          © {new Date().getFullYear()} Todos los derechos reservados | KangSync Software.
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8 bg-white p-8 lg:p-12 rounded-2xl shadow-xl lg:shadow-none lg:bg-transparent">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Ingresar al sistema
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Introduce tus credenciales para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Usuario
              </label>
              <input
                {...register('username', {
                  required: 'El usuario es requerido',
                })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none transition-all"
                placeholder="admin"
                autoFocus
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-2">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <input
                {...register('password', {
                  required: 'La contraseña es requerida',
                })}
                type="password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-2">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Permanecer conectado
                </span>
              </label>

              <button
                type="button"
                onClick={() => toast('Contacta al administrador del sistema')}
                className="text-sm font-medium text-primary-700 hover:underline"
              >
                ¿Problemas para entrar?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 rounded-xl shadow-lg shadow-primary-700/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? 'Autenticando...' : 'Acceder'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}