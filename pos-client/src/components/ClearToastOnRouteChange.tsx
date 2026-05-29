import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ClearToastsOnRouteChange() {
  const location = useLocation()

  useEffect(() => {
    toast.dismiss()
  }, [location.pathname])

  return null
}