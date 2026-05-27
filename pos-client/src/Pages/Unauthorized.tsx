import { useNavigate } from 'react-router-dom'

export default function Unauthorized() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900">Sin acceso</h1>
        <p className="text-gray-500 mt-2">No tienes permiso para ver esta página.</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-6">
          Regresar
        </button>
      </div>
    </div>
  )
}