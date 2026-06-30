import { createAdminClient } from '@/utils/supabase/server'
import { Truck, Sparkles, Save, Info } from 'lucide-react'
import { updateDeliverySettings } from './actions'

export default async function DeliverySettingsPage() {
  const supabase = await createAdminClient()
  
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['delivery_fee', 'free_delivery_threshold'])

  let deliveryFee = '49'
  let freeDeliveryThreshold = '499'

  if (settings && settings.length > 0) {
    settings.forEach(item => {
      if (item.key === 'delivery_fee') deliveryFee = item.value
      if (item.key === 'free_delivery_threshold') freeDeliveryThreshold = item.value
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Truck className="text-orange-500" size={32} />
          Marketplace Delivery Configuration
        </h1>
        <p className="text-zinc-400 mt-2">
          Manage standard delivery fees and free delivery threshold rules applied automatically during student checkout.
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <form action={updateDeliverySettings} className="space-y-6">
          
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="text-orange-400 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-orange-200/90 leading-relaxed">
              <strong className="font-semibold text-orange-300">How it works:</strong> When students place orders from the Marketplace, the app checks their cart subtotal. If the subtotal is greater than or equal to the <span className="underline decoration-orange-400">Free Delivery Threshold</span>, delivery is FREE (₹0). Otherwise, the <span className="underline decoration-orange-400">Standard Delivery Fee</span> is applied.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="delivery_fee" className="block text-sm font-medium text-zinc-300">
                Standard Delivery Fee (₹)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <span className="text-zinc-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="delivery_fee"
                  id="delivery_fee"
                  defaultValue={deliveryFee}
                  required
                  min="0"
                  placeholder="49"
                  className="block w-full rounded-xl bg-zinc-950 border border-zinc-800 py-3 pl-8 pr-4 text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                />
              </div>
              <p className="text-xs text-zinc-500">Fixed amount charged per order below the threshold.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="free_delivery_threshold" className="block text-sm font-medium text-zinc-300 flex items-center gap-1.5">
                Free Delivery Threshold (₹)
                <Sparkles className="text-emerald-400" size={14} />
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <span className="text-zinc-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="free_delivery_threshold"
                  id="free_delivery_threshold"
                  defaultValue={freeDeliveryThreshold}
                  required
                  min="0"
                  placeholder="499"
                  className="block w-full rounded-xl bg-zinc-950 border border-zinc-800 py-3 pl-8 pr-4 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                />
              </div>
              <p className="text-xs text-zinc-500">Orders equal to or above this amount get free delivery.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 transition-all"
            >
              <Save size={18} />
              Save Configuration
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
