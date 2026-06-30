import { createAdminClient } from '@/utils/supabase/server'
import { 
  BookOpen, 
  ShoppingCart, 
  Briefcase,
  TrendingUp,
  FolderOpen
} from 'lucide-react'

async function getStats() {
  const supabase = await createAdminClient()
  
  const [
    { count: subjectsCount },
    { count: resourcesCount },
    { count: skillsCount },
    { count: ordersCount },
    { data: ordersData }
  ] = await Promise.all([
    supabase.from('subjects').select('*', { count: 'exact', head: true }),
    supabase.from('resources').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('skills').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*, marketplace_services(price)').eq('status', 'completed')
  ])

  // Calculate revenue
  const revenue = ordersData?.reduce((acc, order) => {
    // any typing bypass since marketplace_services is joined
    const servicePrice = (order.marketplace_services as any)?.price || 0
    return acc + servicePrice
  }, 0) || 0

  return {
    subjects: subjectsCount || 0,
    resources: resourcesCount || 0,
    skills: skillsCount || 0,
    pendingOrders: ordersCount || 0,
    revenue
  }
}

export default async function DashboardOverview() {
  let stats = { subjects: 0, resources: 0, skills: 0, pendingOrders: 0, revenue: 0 }
  try {
    stats = await getStats()
  } catch (error) {
    console.error("Failed to fetch stats:", error)
  }

  const statCards = [
    {
      title: 'Total Subjects',
      value: stats.subjects,
      icon: BookOpen,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10'
    },
    {
      title: 'Total Resources',
      value: stats.resources,
      icon: FolderOpen,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10'
    },
    {
      title: 'Skill Pathways',
      value: stats.skills,
      icon: Briefcase,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: ShoppingCart,
      color: 'text-rose-400',
      bg: 'bg-rose-400/10'
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-400">{stat.title}</p>
              <h2 className="text-3xl font-bold mt-2 text-white">{stat.value}</h2>
            </div>
            <div className={`p-4 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-white">Revenue Overview</h3>
            <TrendingUp className="text-emerald-400" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-white">₹{stats.revenue.toLocaleString()}</span>
            <span className="text-sm text-zinc-400 mb-1">Total Earned</span>
          </div>
        </div>
        
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl">
          <h3 className="font-semibold text-lg text-white mb-4">Recent Pending Orders</h3>
          <div className="text-sm text-zinc-400 flex items-center justify-center h-24 border border-dashed border-zinc-700/50 rounded-xl">
            {stats.pendingOrders > 0 ? (
               "Orders feed will appear here."
            ) : (
               "No pending orders currently."
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
