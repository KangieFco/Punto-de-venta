import Modal from './Modal'

interface Props {
  title:     string
  message:   string
  onConfirm: () => void
  onCancel:  () => void
  loading?:  boolean
  danger?:   boolean
}

export default function ConfirmDialog({
  title, message, onConfirm, onCancel, loading, danger
}: Props) {
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <p className="text-gray-600 text-sm">{message}</p>
      <div className="flex gap-3 mt-6 justify-end">
        <button onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={danger ? 'btn-danger' : 'btn-primary'}
        >
          {loading ? 'Procesando...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  )
}