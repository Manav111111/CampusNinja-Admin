'use client'

import { Trash2 } from 'lucide-react'

interface DeleteButtonProps {
  confirmMessage: string
}

export function DeleteButton({ confirmMessage }: DeleteButtonProps) {
  return (
    <button
      type="submit"
      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault()
        }
      }}
    >
      <Trash2 size={16} />
    </button>
  )
}
