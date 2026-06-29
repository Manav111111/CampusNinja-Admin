'use client'

export function StatusSelect({ orderId, currentStatus, action }: { 
  orderId: string
  currentStatus: string
  action: (formData: FormData) => void 
}) {
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={orderId} />
      <select 
        name="status" 
        defaultValue={currentStatus}
        onChange={(e) => e.target.form?.requestSubmit()}
        className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-lg outline-none focus:border-indigo-500"
      >
        <option value="pending">Pending</option>
        <option value="contacted">Contacted</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </form>
  )
}

export function PaymentStatusSelect({ orderId, currentStatus, action }: { 
  orderId: string
  currentStatus: string
  action: (formData: FormData) => void 
}) {
  return (
    <form action={action} className="flex items-center gap-2 border-l border-zinc-800 pl-3">
      <input type="hidden" name="id" value={orderId} />
      <select 
        name="payment_status" 
        defaultValue={currentStatus}
        onChange={(e) => e.target.form?.requestSubmit()}
        className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-lg outline-none focus:border-emerald-500"
      >
        <option value="pending">Payment Pending</option>
        <option value="paid">Paid</option>
        <option value="failed">Failed</option>
      </select>
    </form>
  )
}
