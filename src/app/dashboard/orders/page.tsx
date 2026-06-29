import { createAdminClient } from '@/utils/supabase/server'
import { Mail, Phone, Clock, CheckCircle2, XCircle, Loader2, Paperclip, Download, MapPin, Building2, CreditCard } from 'lucide-react'
import { updateOrderStatus, updateOrderNotes, updatePaymentStatus } from './actions'
import { StatusSelect, PaymentStatusSelect } from '@/components/OrderSelects'

type Order = {
  id: string
  created_at: string
  status: string
  payment_status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  requirement: string
  admin_notes: string
  user_id?: string | null
  college_name?: string | null
  address?: string | null
  payment_method?: string | null
  file_url?: string | null
  instructions?: string | null
  products?: { title: string }
}

export default async function OrdersPage() {
  const supabase = await createAdminClient()
  
  const { data: orders } = await supabase
    .from('orders')
    .select('*, products(title)')
    .order('created_at', { ascending: false })

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
      case 'in_progress': return 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20'
      case 'contacted': return 'bg-amber-400/10 text-amber-400 border-amber-400/20'
      case 'cancelled': return 'bg-rose-400/10 text-rose-400 border-rose-400/20'
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 size={14} className="mr-1.5" />
      case 'in_progress': return <Loader2 size={14} className="mr-1.5 animate-spin" />
      case 'cancelled': return <XCircle size={14} className="mr-1.5" />
      default: return <Clock size={14} className="mr-1.5" />
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Orders Desk</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {!orders?.length ? (
          <div className="p-12 text-center border border-dashed border-zinc-800/50 rounded-2xl text-zinc-500">
            No customer orders found.
          </div>
        ) : (
          (orders as Order[]).map((order) => (
            <div key={order.id} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white">{order.customer_name}</h3>
                    <span className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(order.status)} capitalize`}>
                      {getStatusIcon(order.status)}
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Product: <span className="text-indigo-400 font-medium">{(order.products as any)?.title || 'Unknown Product'}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-zinc-500">Order ID: {order.id.split('-')[0]}...</span>
                    <span className="text-sm text-zinc-500">•</span>
                    <span className="text-sm text-zinc-500">{new Date(order.created_at).toLocaleDateString()}</span>
                    {order.user_id && (
                      <>
                        <span className="text-sm text-zinc-500">•</span>
                        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">Registered User</span>
                      </>
                    )}
                    {order.file_url && (
                      <>
                        <span className="text-sm text-zinc-500">•</span>
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                          <Paperclip size={12} /> Attachment
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a href={`mailto:${order.customer_email}`} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors">
                    <Mail size={16} /> Email
                  </a>
                  <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors">
                    <Phone size={16} /> Call
                  </a>
                  <StatusSelect orderId={order.id} currentStatus={order.status} action={updateOrderStatus} />
                  <PaymentStatusSelect orderId={order.id} currentStatus={order.payment_status || 'pending'} action={updatePaymentStatus} />
                </div>
              </div>

              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.college_name && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                        <Building2 size={16} className="text-zinc-500" /> College
                      </div>
                      <p className="text-sm text-zinc-400">{order.college_name}</p>
                    </div>
                  )}
                  {order.payment_method && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                        <CreditCard size={16} className="text-zinc-500" /> Payment Method
                      </div>
                      <p className="text-sm text-zinc-400 uppercase">{order.payment_method}</p>
                    </div>
                  )}
                  {order.address && (
                    <div className="space-y-1 md:col-span-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                        <MapPin size={16} className="text-zinc-500" /> Delivery Address
                      </div>
                      <p className="text-sm text-zinc-400">{order.address}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-zinc-800/50">
                  {order.requirement && (
                    <div>
                      <p className="text-sm font-medium text-zinc-300 mb-1">Requirement:</p>
                      <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{order.requirement}</p>
                    </div>
                  )}
                  {order.instructions && (
                    <div>
                      <p className="text-sm font-medium text-zinc-300 mb-1">Specific Instructions:</p>
                      <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{order.instructions}</p>
                    </div>
                  )}
                </div>

                {order.file_url && (
                  <div className="pt-3 border-t border-zinc-800/50">
                    <a 
                      href={order.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-sm font-medium transition-colors border border-indigo-500/20"
                    >
                      <Download size={16} />
                      Download / View Assignment PDF
                    </a>
                  </div>
                )}
              </div>

              <form action={updateOrderNotes} className="flex gap-3">
                <input type="hidden" name="id" value={order.id} />
                <input 
                  name="admin_notes" 
                  defaultValue={order.admin_notes || ''} 
                  placeholder="Internal team notes..." 
                  className="flex-1 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button type="submit" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors">
                  Save Note
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
